<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;

class TeenController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === 'parent', 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class, 'email')],
            'points_balance' => ['required', 'integer', 'min:0'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => 'teen',
            'points_balance' => $data['points_balance'],
            'password' => Hash::make($data['password']),
        ]);

        return response()->json([
            'message' => __('messages.teen.created'),
        ], 201);
    }

    public function update(Request $request, User $teen): JsonResponse
    {
        abort_unless($request->user()?->role === 'parent', 403);
        abort_unless($teen->role === 'teen', 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class, 'email')->ignore($teen->id)],
            'points_balance' => ['required', 'integer', 'min:0'],
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
        ]);

        $payload = [
            'name' => $data['name'],
            'email' => $data['email'],
            'points_balance' => $data['points_balance'],
        ];

        if (filled($data['password'] ?? null)) {
            $payload['password'] = Hash::make($data['password']);
        }

        $teen->update($payload);

        return response()->json([
            'message' => __('messages.teen.updated'),
        ]);
    }

    public function updatePoints(Request $request, User $teen): JsonResponse
    {
        abort_unless($request->user()?->role === 'parent', 403);
        abort_unless($teen->role === 'teen', 404);

        $data = $request->validate([
            'points_balance' => ['required', 'integer', 'min:0'],
        ]);

        $teen->update([
            'points_balance' => $data['points_balance'],
        ]);

        return response()->json([
            'message' => __('messages.teen.points_updated'),
        ]);
    }

    public function destroy(Request $request, User $teen): JsonResponse
    {
        abort_unless($request->user()?->role === 'parent', 403);
        abort_unless($teen->role === 'teen', 404);

        $teen->delete();

        return response()->json([
            'message' => __('messages.teen.deleted'),
        ]);
    }
}
