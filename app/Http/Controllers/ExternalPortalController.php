<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\UserDevice;
use App\Services\UniFiService;
use App\Services\WifiAccessService;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class ExternalPortalController extends Controller
{
    public function __construct(
        private readonly UniFiService $unifiService,
        private readonly WifiAccessService $wifiAccessService,
    ) {}

    public function show(Request $request): View|RedirectResponse
    {
        if ($request->query('id') !== null) {
            $context = $this->validatedContext($request);
            if ($context === null) {
                return view('portal.index', ['state' => 'invalid_context']);
            }

            $request->session()->put('external_portal', $context);

            return redirect()->route('portal.show');
        }

        $context = $request->session()->get('external_portal');
        if (! is_array($context) || ! $this->contextIsCurrent($context)) {
            return view('portal.index', ['state' => 'invalid_context']);
        }

        $user = $request->user();
        if ($user === null) {
            return view('portal.index', ['state' => 'login', 'context' => $context]);
        }
        if ($user->role !== 'teen') {
            return view('portal.index', ['state' => 'teen_only', 'context' => $context]);
        }

        $device = UserDevice::query()
            ->where('user_id', $user->id)
            ->where('mac_address', $context['mac'])
            ->where('status', 'active')
            ->first();
        if ($device === null) {
            return view('portal.index', ['state' => 'device_not_approved', 'context' => $context]);
        }

        $activeRedemption = $this->wifiAccessService->activeRedemptionFor($user);
        $activeDeviceGrant = null;
        if ($activeRedemption !== null) {
            $activeDeviceGrant = $device->accessGrants()
                ->where('reward_redemption_id', $activeRedemption->id)
                ->first();
            if ($activeDeviceGrant?->status !== 'synced') {
                $this->wifiAccessService->authorizeDeviceForRedemption($device, $activeRedemption, 'portal_session_reuse');
                $activeDeviceGrant = $device->accessGrants()
                    ->where('reward_redemption_id', $activeRedemption->id)
                    ->first();
            }
        }

        return view('portal.index', [
            'state' => 'ready',
            'context' => $context,
            'device' => $device,
            'rewards' => Reward::query()->where('type', 'wifi')->orderBy('points_cost')->get(),
            'activeRedemption' => $activeRedemption,
            'activeDeviceGrant' => $activeDeviceGrant,
        ]);
    }

    public function login(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        if ($request->user()?->role !== 'teen') {
            Auth::logout();
            $request->session()->regenerate();

            return redirect()->route('portal.show')->withErrors(['email' => __('portal.errors.teen_account_required')]);
        }

        return redirect()->route('portal.show');
    }

    public function redeem(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->role === 'teen', 403);

        $data = $request->validate([
            'reward_id' => ['required', 'integer', 'exists:rewards,id'],
            'request_key' => ['required', 'uuid'],
        ]);

        $context = $request->session()->get('external_portal');
        if (! is_array($context) || ! $this->contextIsCurrent($context)) {
            return redirect()->route('portal.show')->withErrors(['portal' => __('portal.errors.reconnect')]);
        }

        $user = $request->user();
        $device = UserDevice::query()
            ->where('user_id', $user->id)
            ->where('mac_address', $context['mac'])
            ->where('status', 'active')
            ->first();
        if ($device === null) {
            return redirect()->route('portal.show')->withErrors(['device' => __('portal.errors.device_not_approved')]);
        }

        $reward = Reward::query()->where('type', 'wifi')->findOrFail($data['reward_id']);
        $existing = RewardRedemption::query()->where('portal_request_key', $data['request_key'])->first();
        if ($existing !== null) {
            abort_unless($existing->user_id === $user->id && $existing->user_device_id === $device->id, 409);

            return redirect()->route('portal.show')->with('status', __('portal.already_processed'));
        }

        try {
            [$redemption, $expiresAt, $outcome] = DB::transaction(function () use ($user, $device, $reward, $data): array {
                $lockedUser = $user->newQuery()->lockForUpdate()->findOrFail($user->id);
                $lockedDevice = UserDevice::query()->lockForUpdate()->findOrFail($device->id);
                abort_unless($lockedDevice->user_id === $lockedUser->id && $lockedDevice->status === 'active', 403);

                $duplicate = RewardRedemption::query()->where('portal_request_key', $data['request_key'])->first();
                if ($duplicate !== null) {
                    abort_unless($duplicate->user_id === $lockedUser->id && $duplicate->user_device_id === $lockedDevice->id, 409);

                    return [$duplicate, $duplicate->access_expires_at, 'duplicate'];
                }

                if ($lockedUser->points_balance < $reward->points_cost) {
                    throw new \DomainException(__('portal.errors.not_enough_points'));
                }

                $lastExpiry = RewardRedemption::query()
                    ->where('user_id', $lockedUser->id)
                    ->where('status', 'fulfilled')
                    ->where('unifi_sync_status', 'synced')
                    ->where('access_expires_at', '>', now())
                    ->whereHas('reward', fn ($query) => $query->where('type', 'wifi'))
                    ->max('access_expires_at');
                $startsAt = $lastExpiry ? Carbon::parse($lastExpiry) : now();
                $expiresAt = $startsAt->copy()->addMinutes((int) $reward->duration_minutes);

                $lockedUser->decrement('points_balance', $reward->points_cost);
                $redemption = RewardRedemption::query()->create([
                    'user_id' => $lockedUser->id,
                    'reward_id' => $reward->id,
                    'user_device_id' => $lockedDevice->id,
                    'device_mac' => $lockedDevice->mac_address,
                    'status' => 'pending',
                    'redeemed_at' => now(),
                    'access_expires_at' => $expiresAt,
                    'portal_request_key' => $data['request_key'],
                    'unifi_sync_status' => 'pending',
                ]);

                $redemption->load('reward');
                if (! $this->wifiAccessService->authorizeDeviceForRedemption($lockedDevice, $redemption, 'portal_redemption')) {
                    $lockedUser->increment('points_balance', $reward->points_cost);
                    $redemption->update(['status' => 'failed', 'unifi_sync_status' => 'failed']);

                    return [$redemption, $expiresAt, 'failed'];
                }

                $approvedDevices = UserDevice::query()
                    ->where('user_id', $lockedUser->id)
                    ->where('status', 'active')
                    ->whereKeyNot($lockedDevice->id)
                    ->orderBy('id')
                    ->get();
                foreach ($approvedDevices as $approvedDevice) {
                    $this->wifiAccessService->authorizeDeviceForRedemption($approvedDevice, $redemption, 'shared_reward');
                }

                $redemption->update(['status' => 'fulfilled', 'unifi_sync_status' => 'synced']);

                return [$redemption, $expiresAt, 'success'];
            });
        } catch (\DomainException $exception) {
            return redirect()->route('portal.show')->withErrors(['reward' => $exception->getMessage()]);
        } catch (QueryException $exception) {
            $duplicate = RewardRedemption::query()->where('portal_request_key', $data['request_key'])->first();
            if ($duplicate !== null && $duplicate->user_id === $user->id && $duplicate->user_device_id === $device->id) {
                return redirect()->route('portal.show')->with('status', __('portal.already_processed'));
            }

            throw $exception;
        }

        if ($outcome === 'duplicate') {
            return redirect()->route('portal.show')->with('status', __('portal.already_processed'));
        }
        if ($outcome === 'failed') {
            return redirect()->route('portal.show')->withErrors(['portal' => __('portal.errors.unifi_failed')]);
        }

        return redirect()->route('portal.show')->with('status', __('portal.access_granted_until', ['time' => $expiresAt->format('H:i')]));
    }

    /** @return array{mac: string, ssid: string, ap_mac: string|null}|null */
    private function validatedContext(Request $request): ?array
    {
        $mac = $request->query('id');
        $ssid = $request->query('ssid');
        $apMac = $request->query('ap');
        if (! is_string($mac) || ! preg_match('/^([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$/', $mac) || ! is_string($ssid) || $ssid === '') {
            return null;
        }

        $allowedSsid = config('services.unifi.portal_ssid');
        if (! is_string($allowedSsid) || $allowedSsid === '' || ! hash_equals($allowedSsid, $ssid)) {
            return null;
        }

        $context = ['mac' => strtolower(str_replace('-', ':', $mac)), 'ssid' => $ssid, 'ap_mac' => is_string($apMac) ? strtolower(str_replace('-', ':', $apMac)) : null];

        return $this->contextIsCurrent($context) ? $context : null;
    }

    /** @param array{mac: string, ssid: string, ap_mac?: string|null} $context */
    private function contextIsCurrent(array $context): bool
    {
        try {
            $client = $this->unifiService->getConnectedClient($context['mac']);
        } catch (\Throwable) {
            return false;
        }

        return $client !== null
            && ($client['ssid'] ?? null) === $context['ssid']
            && (($context['ap_mac'] ?? null) === null || ($client['ap_mac'] ?? null) === $context['ap_mac']);
    }
}
