<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reward;
use App\Models\RewardRedemption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RewardController extends Controller
{
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
        ]);

        $voucherCode = sprintf('VOUCHER-%d-%d', $reward->id, $redemption->id);
        $redemption->update([
            'voucher_code' => $voucherCode,
        ]);

        return response()->json([
            'message' => __('messages.reward.redeemed_with_voucher', ['voucher' => $voucherCode]),
            'voucherCode' => $voucherCode,
        ], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateReward(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'points_cost' => ['required', 'integer', 'min:0'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'emoji' => ['nullable', 'string', 'max:64'],
        ]);

        $data['emoji'] = filled($data['emoji'] ?? null) ? $data['emoji'] : '🎁';

        return $data;
    }
}
