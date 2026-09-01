<?php

namespace App\Services;

use App\Models\Chore;
use App\Models\ChoreClaim;
use App\Models\User;
use Carbon\Carbon;

class ClaimService
{
    /**
     * Calculate the period start date for a chore based on its recurrence rules.
     */
    public function calculatePeriodStart(Chore $chore, Carbon $now): Carbon
    {
        return match ($chore->recurrence_type) {
            'daily' => $now->copy()->startOfDay(),
            'weekly' => $now->copy()->startOfWeek(),
            'monthly' => $now->copy()->startOfMonth(),
            'custom' => $this->calculateCustomPeriodStart($chore, $now),
            default => $now->copy()->startOfDay(),
        };
    }

    /**
     * Calculate custom period start based on chore creation date and interval.
     */
    private function calculateCustomPeriodStart(Chore $chore, Carbon $now): Carbon
    {
        $interval = (int) ($chore->recurrence_interval ?? 1);
        $unit = $chore->recurrence_unit ?: 'days';
        $anchor = Carbon::parse($chore->created_at)->startOfDay();
        $diff = (int) match ($unit) {
            'days' => $anchor->diffInDays($now),
            'weeks' => $anchor->diffInWeeks($now),
            'months' => $anchor->diffInMonths($now),
            default => $anchor->diffInDays($now),
        };
        $periodCount = intdiv($diff, max($interval, 1));

        return match ($unit) {
            'days' => $anchor->copy()->addDays($periodCount * $interval),
            'weeks' => $anchor->copy()->addWeeks($periodCount * $interval)->startOfWeek(),
            'months' => $anchor->copy()->addMonths($periodCount * $interval)->startOfMonth(),
            default => $anchor->copy()->addDays($periodCount * $interval),
        };
    }

    /**
     * Create a new chore claim for a user (teen-initiated).
     * Returns the created claim or null with error message.
     */
    public function createClaimForTeen(Chore $chore, User $teen): array
    {
        $periodStart = $this->calculatePeriodStart($chore, Carbon::now());

        $existing = ChoreClaim::query()
            ->where('chore_id', $chore->id)
            ->where('user_id', $teen->id)
            ->whereDate('period_start', $periodStart->toDateString())
            ->first();

        if ($existing) {
            return [
                'success' => false,
                'message' => __('messages.claim.already_claimed_current_period'),
                'status_code' => 422,
            ];
        }

        $claim = ChoreClaim::query()->create([
            'chore_id' => $chore->id,
            'user_id' => $teen->id,
            'period_start' => $periodStart->toDateString(),
            'status' => 'pending',
        ]);

        return [
            'success' => true,
            'message' => __('messages.claim.submitted_for_approval'),
            'claim' => $claim,
            'status_code' => 201,
        ];
    }

    /**
     * Create and immediately approve a chore claim on behalf of a teen.
     * Awards points automatically.
     * Returns the created claim or error response.
     */
    public function createAndApproveClaim(Chore $chore, User $teen): array
    {
        $periodStart = $this->calculatePeriodStart($chore, Carbon::now());

        $existing = ChoreClaim::query()
            ->where('chore_id', $chore->id)
            ->where('user_id', $teen->id)
            ->whereDate('period_start', $periodStart->toDateString())
            ->first();

        if ($existing) {
            return [
                'success' => false,
                'message' => __('messages.claim.already_claimed_current_period'),
                'status_code' => 422,
            ];
        }

        $points = $chore->points_value;
        $teen->increment('points_balance', $points);

        $claim = ChoreClaim::query()->create([
            'chore_id' => $chore->id,
            'user_id' => $teen->id,
            'period_start' => $periodStart->toDateString(),
            'status' => 'approved',
            'points_awarded' => $points,
        ]);

        return [
            'success' => true,
            'message' => __('messages.claim.approved'),
            'claim' => $claim,
            'status_code' => 201,
        ];
    }
}
