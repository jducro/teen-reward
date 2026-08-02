<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ChoreController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === 'parent', 403);

        $data = $this->validateChore($request);
        $data['created_by'] = $request->user()->id;

        Chore::query()->create($data);

        return response()->json([
            'message' => __('messages.chore.created'),
        ], 201);
    }

    public function update(Request $request, Chore $chore): JsonResponse
    {
        abort_unless($request->user()?->role === 'parent', 403);
        abort_unless($chore->created_by === $request->user()->id, 403);

        $chore->update($this->validateChore($request));

        return response()->json([
            'message' => __('messages.chore.updated'),
        ]);
    }

    public function destroy(Request $request, Chore $chore): JsonResponse
    {
        abort_unless($request->user()?->role === 'parent', 403);
        abort_unless($chore->created_by === $request->user()->id, 403);

        $chore->delete();

        return response()->json([
            'message' => __('messages.chore.deleted'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateChore(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'points_value' => ['required', 'integer', 'min:0'],
            'emoji' => ['nullable', 'string', 'max:64'],
            'recurrence_type' => ['required', Rule::in(['none', 'daily', 'weekly', 'monthly', 'custom'])],
            'recurrence_interval' => ['nullable', 'integer', 'min:1', 'required_if:recurrence_type,custom'],
            'recurrence_unit' => ['nullable', Rule::in(['days', 'weeks', 'months']), 'required_if:recurrence_type,custom'],
            'active' => ['sometimes', 'boolean'],
        ]);

        if ($data['recurrence_type'] !== 'custom') {
            $data['recurrence_interval'] = null;
            $data['recurrence_unit'] = null;
        }

        $data['active'] ??= true;
        $data['emoji'] = filled($data['emoji'] ?? null) ? $data['emoji'] : '🧹';

        return $data;
    }
}
