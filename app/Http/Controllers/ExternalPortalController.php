<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Models\DeviceEvent;
use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\UserDevice;
use App\Services\UniFiService;
use App\Services\WifiAccessService;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

class ExternalPortalController extends Controller
{
    public function __construct(
        private readonly UniFiService $unifiService,
        private readonly WifiAccessService $wifiAccessService,
    ) {}

    public function show(Request $request, ?string $site = null): View|RedirectResponse
    {
        if ($request->query('id') !== null) {
            $context = $this->validatedContext($request, $site);
            if ($context === null) {
                return view('portal.index', ['state' => 'invalid_context']);
            }

            $request->session()->put('external_portal', $context);

            return $this->portalRedirect($request, $site);
        }

        $context = $request->session()->get('external_portal');
        if (! is_array($context) || ! $this->contextMatchesConfiguration($context)) {
            return view('portal.index', ['state' => 'invalid_context']);
        }

        $user = $request->user();
        if ($user === null) {
            return view('portal.index', ['state' => 'login', 'context' => $context]);
        }
        if ($user->role !== 'teen') {
            return view('portal.index', ['state' => 'teen_only', 'context' => $context]);
        }

        if (! $this->contextIsCurrent($context)) {
            return view('portal.index', ['state' => 'client_pending', 'context' => $context]);
        }

        $device = $this->resolvePortalDevice($user->id, $context['mac']);
        if ($device === null) {
            return view('portal.index', ['state' => 'device_unavailable', 'context' => $context]);
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

    public function login(LoginRequest $request, ?string $site = null): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        if ($request->user()?->role !== 'teen') {
            Auth::logout();
            $request->session()->regenerate();

            return $this->portalRedirect($request, $site)->withErrors(['email' => __('portal.errors.teen_account_required')]);
        }

        return $this->portalRedirect($request, $site);
    }

    public function redeem(Request $request, ?string $site = null): RedirectResponse
    {
        abort_unless($request->user()?->role === 'teen', 403);

        $data = $request->validate([
            'reward_id' => ['required', 'integer', 'exists:rewards,id'],
            'request_key' => ['required', 'uuid'],
        ]);

        $context = $request->session()->get('external_portal');
        if (! is_array($context) || ! $this->contextIsCurrent($context)) {
            return $this->portalRedirect($request, $site)->withErrors(['portal' => __('portal.errors.reconnect')]);
        }

        $user = $request->user();
        $device = $this->resolvePortalDevice($user->id, $context['mac']);
        if ($device === null) {
            return $this->portalRedirect($request, $site)->withErrors(['device' => __('portal.errors.device_unavailable')]);
        }

        $reward = Reward::query()->where('type', 'wifi')->findOrFail($data['reward_id']);
        $existing = RewardRedemption::query()->where('portal_request_key', $data['request_key'])->first();
        if ($existing !== null) {
            abort_unless($existing->user_id === $user->id && $existing->user_device_id === $device->id, 409);

            return $this->portalRedirect($request, $site)->with('status', __('portal.already_processed'));
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
            return $this->portalRedirect($request, $site)->withErrors(['reward' => $exception->getMessage()]);
        } catch (QueryException $exception) {
            $duplicate = RewardRedemption::query()->where('portal_request_key', $data['request_key'])->first();
            if ($duplicate !== null && $duplicate->user_id === $user->id && $duplicate->user_device_id === $device->id) {
                return $this->portalRedirect($request, $site)->with('status', __('portal.already_processed'));
            }

            throw $exception;
        }

        if ($outcome === 'duplicate') {
            return $this->portalRedirect($request, $site)->with('status', __('portal.already_processed'));
        }
        if ($outcome === 'failed') {
            return $this->portalRedirect($request, $site)->withErrors(['portal' => __('portal.errors.unifi_failed')]);
        }

        return $this->portalRedirect($request, $site)->with('status', __('portal.access_granted_until', ['time' => $expiresAt->format('H:i')]));
    }

    /** @return array{mac: string, ssid: string, ap_mac: string|null, site: string|null, timestamp: int|null, return_url: string|null}|null */
    private function validatedContext(Request $request, ?string $site): ?array
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

        if ($site !== null) {
            $configuredPortalSite = config('services.unifi.site', 'default');
            if (! is_string($configuredPortalSite) || ! hash_equals($configuredPortalSite, $site)) {
                return null;
            }
        }

        $timestamp = $request->query('t');
        $returnUrl = $request->query('url');
        if ($timestamp !== null && (! is_string($timestamp) || ! ctype_digit($timestamp))) {
            return null;
        }
        if ($returnUrl !== null && ! is_string($returnUrl)) {
            return null;
        }

        $context = [
            'mac' => strtolower(str_replace('-', ':', $mac)),
            'ssid' => $ssid,
            'ap_mac' => is_string($apMac) ? strtolower(str_replace('-', ':', $apMac)) : null,
            'site' => $site,
            'timestamp' => is_string($timestamp) ? (int) $timestamp : null,
            'return_url' => $returnUrl,
        ];

        return $context;
    }

    /** @param array{mac: string, ssid: string, ap_mac?: string|null} $context */
    private function contextIsCurrent(array $context): bool
    {
        try {
            $client = $this->unifiService->getConnectedClient($context['mac']);
        } catch (\Throwable $exception) {
            Log::warning('UniFi portal client verification request failed', [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            return false;
        }

        if ($client === null) {
            return false;
        }

        $isCurrent = (! is_string($client['ssid'] ?? null) || $client['ssid'] === $context['ssid'])
            && (($context['ap_mac'] ?? null) === null
                || ! is_string($client['ap_mac'] ?? null)
                || $client['ap_mac'] === $context['ap_mac']);

        if (! $isCurrent) {
            Log::notice('UniFi portal client verification did not match the supplied connection context', [
                'client_found' => true,
                'ssid_matches' => ! is_string($client['ssid'] ?? null) || $client['ssid'] === $context['ssid'],
                'access_point_matches' => ($context['ap_mac'] ?? null) === null
                    || ! is_string($client['ap_mac'] ?? null)
                    || $client['ap_mac'] === $context['ap_mac'],
            ]);
        }

        return $isCurrent;
    }

    /** @param array{mac: string, ssid: string, site?: string|null} $context */
    private function contextMatchesConfiguration(array $context): bool
    {
        if (! is_string($context['mac'] ?? null)
            || ! preg_match('/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/', $context['mac'])
            || ! is_string($context['ssid'] ?? null)
            || ! is_string(config('services.unifi.portal_ssid'))
            || ! hash_equals(config('services.unifi.portal_ssid'), $context['ssid'])) {
            return false;
        }

        if (is_string($context['site'] ?? null)) {
            $configuredPortalSite = config('services.unifi.site', 'default');

            return is_string($configuredPortalSite) && hash_equals($configuredPortalSite, $context['site']);
        }

        return true;
    }

    private function portalRedirect(Request $request, ?string $site = null): RedirectResponse
    {
        $context = $request->session()->get('external_portal');
        $site ??= is_array($context) && is_string($context['site'] ?? null) ? $context['site'] : null;

        return $site !== null
            ? redirect()->route('portal.external.show', ['site' => $site])
            : redirect()->route('portal.show');
    }

    private function resolvePortalDevice(int $userId, string $mac): ?UserDevice
    {
        try {
            return DB::transaction(function () use ($userId, $mac): ?UserDevice {
                $device = UserDevice::query()->where('mac_address', $mac)->lockForUpdate()->first();
                if ($device !== null) {
                    if ($device->user_id !== $userId || $device->status === 'rejected' || $device->status === 'inactive') {
                        return null;
                    }

                    if ($device->status === 'pending_approval') {
                        $device->update(['status' => 'active']);
                        DeviceEvent::query()->create([
                            'device_id' => $device->id,
                            'user_id' => $userId,
                            'actor_id' => $userId,
                            'mac_address' => $device->mac_address,
                            'device_name' => $device->name,
                            'action' => 'portal_activated',
                        ]);
                    }

                    return $device->fresh();
                }

                $device = UserDevice::query()->create([
                    'user_id' => $userId,
                    'mac_address' => $mac,
                    'status' => 'active',
                ]);
                DeviceEvent::query()->create([
                    'device_id' => $device->id,
                    'user_id' => $userId,
                    'actor_id' => $userId,
                    'mac_address' => $device->mac_address,
                    'device_name' => $device->name,
                    'action' => 'portal_registered',
                ]);

                return $device;
            });
        } catch (UniqueConstraintViolationException) {
            return null;
        }
    }
}
