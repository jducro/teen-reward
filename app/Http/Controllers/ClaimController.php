<?php

namespace App\Http\Controllers;

use App\Models\Chore;
use App\Models\ChoreClaim;
use Carbon\Carbon;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClaimController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    // Teen: list their claims
    public function index(): View
    {
        if (Auth::user()->role !== 'teen') {
            abort(403);
        }

        $claims = ChoreClaim::where('user_id', Auth::id())->with('chore')->latest()->get();

        return view('claims.index', compact('claims'));
    }

    // Teen: claim a chore (one per period)
    public function store(Request $request, Chore $chore): RedirectResponse
    {
        if (Auth::user()->role !== 'teen') {
            abort(403);
        }

        $periodStart = $this->calculatePeriodStart($chore, Carbon::now());

        $existing = ChoreClaim::where('chore_id', $chore->id)
            ->where('user_id', auth()->id())
            ->whereDate('period_start', $periodStart->toDateString())
            ->first();

        if ($existing) {
            return redirect()->back()->with('status', __('messages.claim.already_claimed_current_period'));
        }

        ChoreClaim::create([
            'chore_id' => $chore->id,
            'user_id' => Auth::id(),
            'period_start' => $periodStart->toDateString(),
            'status' => 'pending',
        ]);

        return redirect()->back()->with('status', __('messages.claim.submitted_for_approval'));
    }

    // Parent: list pending claims for household (simple: all pending)
    public function pending(): View
    {
        if (Auth::user()->role !== 'parent') {
            abort(403);
        }

        $claims = ChoreClaim::where('status', 'pending')->with('chore', 'user')->latest()->get();

        return view('claims.pending', compact('claims'));
    }

    public function approve(ChoreClaim $claim): RedirectResponse
    {
        if (Auth::user()->role !== 'parent') {
            abort(403);
        }

        // award points
        $points = $claim->chore->points_value;
        $claim->user->increment('points_balance', $points);
        $claim->update(['status' => 'approved', 'points_awarded' => $points]);

        return redirect()->back()->with('status', __('messages.claim.approved'));
    }

    public function reject(ChoreClaim $claim): RedirectResponse
    {
        if (Auth::user()->role !== 'parent') {
            abort(403);
        }

        $claim->update(['status' => 'rejected']);

        return redirect()->back()->with('status', __('messages.claim.rejected'));
    }

    private function calculatePeriodStart(Chore $chore, Carbon $now): Carbon
    {
        return match ($chore->recurrence_type) {
            'daily' => $now->startOfDay(),
            'weekly' => $now->copy()->startOfWeek(),
            'monthly' => $now->copy()->startOfMonth(),
            'custom' => $this->calculateCustomPeriodStart($chore, $now),
            default => $now->startOfDay(),
        };
    }

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
}
