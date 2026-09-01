<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chore;
use App\Models\ChoreClaim;
use App\Models\User;
use App\Services\ClaimService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClaimController extends Controller
{
    public function __construct(private ClaimService $claimService) {}

    /**
     * Teen-initiated claim (requires approval).
     */
    public function store(Request $request, Chore $chore): JsonResponse
    {
        abort_unless($request->user()?->role === 'teen', 403);

        $result = $this->claimService->createClaimForTeen($chore, $request->user());

        return response()->json([
            'message' => $result['message'],
        ], $result['status_code']);
    }

    /**
     * Parent-initiated claim (auto-approved with points awarded).
     */
    public function storeForTeen(Request $request, Chore $chore): JsonResponse
    {
        abort_unless($request->user()?->role === 'parent', 403);

        $validated = $request->validate([
            'teen_id' => 'required|exists:users,id',
        ]);

        $teen = User::findOrFail($validated['teen_id']);
        abort_unless($teen->role === 'teen', 422);

        $result = $this->claimService->createAndApproveClaim($chore, $teen);

        return response()->json([
            'message' => $result['message'],
        ], $result['status_code']);
    }

    public function approve(Request $request, ChoreClaim $claim): JsonResponse
    {
        abort_unless($request->user()?->role === 'parent', 403);

        if ($claim->status !== 'pending') {
            return response()->json([
                'message' => __('messages.claim.only_pending_can_be_approved'),
            ], 422);
        }

        $claim->loadMissing(['chore', 'user']);

        $points = $claim->chore->points_value;
        $claim->user->increment('points_balance', $points);
        $claim->update([
            'status' => 'approved',
            'points_awarded' => $points,
        ]);

        return response()->json([
            'message' => __('messages.claim.approved'),
        ]);
    }

    public function reject(Request $request, ChoreClaim $claim): JsonResponse
    {
        abort_unless($request->user()?->role === 'parent', 403);

        if ($claim->status !== 'pending') {
            return response()->json([
                'message' => __('messages.claim.only_pending_can_be_rejected'),
            ], 422);
        }

        $claim->update([
            'status' => 'rejected',
        ]);

        return response()->json([
            'message' => __('messages.claim.rejected'),
        ]);
    }
}
