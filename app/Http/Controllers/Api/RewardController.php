<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\UniFiSyncLog;
use App\Services\UniFiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RewardController extends Controller
{
    public function __construct(private UniFiService $unifiService) {}

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === 'parent', 403);

        Reward::query()->create($this->validateReward($request));

        return response()->json([
            'message' => __('messages.reward.created'),
        ], 201);
    }

    public function update(Request $request, Reward $reward): JsonResponse
    {
        abort_unless($request->user()?->role === 'parent', 403);

        $reward->update($this->validateReward($request));

        return response()->json([
            'message' => __('messages.reward.updated'),
        ]);
    }

    public function destroy(Request $request, Reward $reward): JsonResponse
    {
        abort_unless($request->user()?->role === 'parent', 403);

        $reward->delete();

        return response()->json([
            'message' => __('messages.reward.deleted'),
        ]);
    }

    public function redeem(Reward $reward): JsonResponse
    {
        $user = auth()->user();

        abort_unless($user?->role === 'teen', 403);

        if ($user->points_balance < $reward->points_cost) {
            return response()->json([
                'message' => __('messages.reward.not_enough_points'),
            ], 422);
        }

        $user->decrement('points_balance', $reward->points_cost);

        $redemption = RewardRedemption::query()->create([
            'user_id' => $user->id,
            'reward_id' => $reward->id,
            'status' => 'fulfilled',
            'redeemed_at' => now(),
            'unifi_sync_status' => $reward->type === 'wifi' ? 'pending' : null,
        ]);

        // Physical rewards don't need WiFi voucher generation
        if ($reward->type === 'physical') {
            return response()->json([
                'message' => __('messages.reward.redeemed', ['reward' => $reward->name]),
                'rewardCode' => 'PHYSICAL_'.$redemption->id,
            ], 201);
        }

        // WiFi vouchers require UniFi integration
        try {
            if (config('app.debug')) {
                logger()->debug('Reward redemption requesting UniFi voucher', [
                    'reward_id' => $reward->id,
                    'reward_type' => $reward->type,
                    'duration_minutes' => $reward->duration_minutes,
                    'user_id' => $user->id,
                    'redemption_id' => $redemption->id,
                ]);
            }

            $voucher = $this->unifiService->generateVoucher(
                duration: $reward->duration_minutes,
                bandwidth: null,
                note: $user->name . ' - ' . $reward->name
            );

            $redemption->update([
                'voucher_code' => $voucher['code'],
                'voucher_expires_at' => $voucher['expires_at'],
                'unifi_sync_status' => 'synced',
            ]);

            UniFiSyncLog::create([
                'redemption_id' => $redemption->id,
                'status' => 'success',
                'api_response' => ['code' => $voucher['code']],
            ]);

            return response()->json([
                'message' => __('messages.reward.redeemed_with_voucher', ['voucher' => $voucher['code']]),
                'voucherCode' => $voucher['code'],
                'voucherExpiresAt' => $voucher['expires_at'],
            ], 201);
        } catch (\Exception $e) {
            if (config('app.debug')) {
                logger()->debug('Reward redemption fell back to demo voucher', [
                    'reward_id' => $reward->id,
                    'reward_type' => $reward->type,
                    'user_id' => $user->id,
                    'redemption_id' => $redemption->id,
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);
            }

            $redemption->update([
                'unifi_sync_status' => 'failed',
            ]);

            UniFiSyncLog::create([
                'redemption_id' => $redemption->id,
                'status' => 'failure',
                'error_message' => $e->getMessage(),
            ]);

            // Generate a local fallback voucher code for local development
            $voucherCode = 'DEMO-' . strtoupper(substr(md5($redemption->id . now()), 0, 8));
            $expiresAt = now()->addMinutes($reward->duration_minutes);

            $redemption->update([
                'voucher_code' => $voucherCode,
                'voucher_expires_at' => $expiresAt,
                'unifi_sync_status' => 'fallback',
            ]);

            return response()->json([
                'message' => __('messages.reward.redeemed_with_voucher', ['voucher' => $voucherCode]),
                'voucherCode' => $voucherCode,
                'voucherExpiresAt' => $expiresAt,
            ], 201);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function validateReward(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:physical,wifi'],
            'points_cost' => ['required', 'integer', 'min:0'],
            'duration_minutes' => ['required_if:type,wifi', 'nullable', 'integer', 'min:1'],
            'emoji' => ['nullable', 'string', 'max:64'],
        ]);

        $data['emoji'] = filled($data['emoji'] ?? null) ? $data['emoji'] : '🎁';

        return $data;
    }
}
