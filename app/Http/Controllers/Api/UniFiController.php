<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\UniFiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UniFiController extends Controller
{
    public function __construct(private UniFiService $unifiService) {}

    public function testConnection(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === 'parent', 403);

        $this->unifiService->isHealthy();

        return response()->json([
            'message' => 'UniFi connection successful.',
        ]);
    }
}
