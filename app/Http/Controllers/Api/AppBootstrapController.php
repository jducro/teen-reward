<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chore;
use App\Models\ChoreClaim;
use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppBootstrapController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'csrfToken' => csrf_token(),
                'user' => null,
                'teens' => [],
            ]);
        }

        $chores = $user->role === 'parent'
            ? Chore::query()
                ->where('created_by', $user->id)
                ->latest()
                ->get()
            : Chore::query()
                ->where('active', true)
                ->latest()
                ->get();

        $claims = $user->role === 'parent'
            ? ChoreClaim::query()
                ->where('status', 'pending')
                ->with(['chore', 'user'])
                ->latest()
                ->get()
            : ChoreClaim::query()
                ->where('user_id', $user->id)
                ->with('chore')
                ->latest()
                ->get();

        $redemptions = RewardRedemption::query()
            ->where('user_id', $user->id)
            ->with('reward')
            ->latest()
            ->get();

        $teens = $user->role === 'parent'
            ? User::query()
                ->where('role', 'teen')
                ->orderBy('name')
                ->orderBy('id')
                ->get()
            : User::query()->whereKey([])->get();

        return response()->json([
            'csrfToken' => csrf_token(),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'pointsBalance' => $user->points_balance,
            ],
            'stats' => [
                'availableChores' => $chores->count(),
                'pendingClaims' => $claims->where('status', 'pending')->count(),
                'rewardsRedeemed' => $redemptions->count(),
            ],
            'teens' => $teens->map(fn (User $teen) => [
                'id' => $teen->id,
                'name' => $teen->name,
                'email' => $teen->email,
                'pointsBalance' => $teen->points_balance,
            ])->values(),
            'chores' => $chores->map(fn (Chore $chore) => [
                'id' => $chore->id,
                'title' => $chore->title,
                'description' => $chore->description,
                'pointsValue' => $chore->points_value,
                'emoji' => $chore->emoji,
                'recurrenceType' => $chore->recurrence_type,
                'recurrenceInterval' => $chore->recurrence_interval,
                'recurrenceUnit' => $chore->recurrence_unit,
                'active' => (bool) $chore->active,
                'createdAt' => optional($chore->created_at)->toIso8601String(),
            ])->values(),
            'claims' => $claims->map(fn (ChoreClaim $claim) => [
                'id' => $claim->id,
                'status' => $claim->status,
                'periodStart' => optional($claim->period_start)->toDateString(),
                'pointsAwarded' => $claim->points_awarded,
                'createdAt' => optional($claim->created_at)->toIso8601String(),
                'chore' => $claim->relationLoaded('chore')
                    ? [
                        'id' => $claim->chore->id,
                        'title' => $claim->chore->title,
                        'pointsValue' => $claim->chore->points_value,
                        'emoji' => $claim->chore->emoji,
                    ]
                    : null,
                'user' => $claim->relationLoaded('user')
                    ? [
                        'id' => $claim->user->id,
                        'name' => $claim->user->name,
                    ]
                    : null,
            ])->values(),
'claimHistory' => ChoreClaim::query()
    ->when($user->role !== 'parent', fn ($query) => $query->where('user_id', $user->id))
    ->with($user->role === 'parent' ? ['chore', 'user'] : ['chore'])
    ->latest()
    ->get()
                    ->map(fn (ChoreClaim $claim) => [
                        'id' => $claim->id,
                        'status' => $claim->status,
                        'periodStart' => optional($claim->period_start)->toDateString(),
                        'pointsAwarded' => $claim->points_awarded,
                        'createdAt' => optional($claim->created_at)->toIso8601String(),
                        'chore' => $claim->relationLoaded('chore')
                            ? [
                                'id' => $claim->chore->id,
                                'title' => $claim->chore->title,
                                'pointsValue' => $claim->chore->points_value,
                                'emoji' => $claim->chore->emoji,
                            ]
                            : null,
                        'user' => $claim->relationLoaded('user')
                            ? [
                                'id' => $claim->user->id,
                                'name' => $claim->user->name,
                            ]
                            : null,
                    ])
                    ->values(),
            'rewards' => Reward::query()
                    ->latest()
                    ->get()
                ->map(fn (Reward $reward) => [
                    'id' => $reward->id,
                    'name' => $reward->name,
                    'pointsCost' => $reward->points_cost,
                    'type' => $reward->type,
                    'durationMinutes' => $reward->duration_minutes,
                    'emoji' => $reward->emoji,
                ])
                ->values(),
            'redemptions' => $redemptions->map(fn (RewardRedemption $redemption) => [
                'id' => $redemption->id,
                'status' => $redemption->status,
                'voucherCode' => $redemption->voucher_code,
                'redeemedAt' => optional($redemption->redeemed_at)->toIso8601String(),
                'reward' => $redemption->reward
                    ? [
                        'id' => $redemption->reward->id,
                        'name' => $redemption->reward->name,
                        'durationMinutes' => $redemption->reward->duration_minutes,
                    ]
                    : null,
            ])->values(),
        ]);
    }
}
