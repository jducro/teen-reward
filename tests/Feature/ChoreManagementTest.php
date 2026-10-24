<?php

namespace Tests\Feature;

use App\Models\Chore;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Tests\TestCase;

class ChoreManagementTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(PreventRequestForgery::class);
    }

    public function test_parent_can_create_edit_and_delete_chore(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);

        $this->actingAs($parent)
            ->postJson('/api/chores', [
                'title' => 'Test chore',
                'description' => 'Do stuff',
                'points_value' => 10,
                'category' => 'big',
                'emoji' => '🧺',
                'recurrence_type' => 'weekly',
                'active' => true,
            ])
            ->assertCreated();

        $this->assertDatabaseHas('chores', ['title' => 'Test chore', 'category' => 'big', 'emoji' => '🧺', 'created_by' => $parent->id]);

        $chore = Chore::first();

        $this->actingAs($parent)
            ->putJson("/api/chores/{$chore->id}", [
                'title' => 'Updated chore',
                'description' => 'Updated',
                'points_value' => 15,
                'category' => 'quick',
                'emoji' => '🚿',
                'recurrence_type' => 'weekly',
                'active' => true,
            ])
            ->assertOk();

        $this->assertDatabaseHas('chores', ['title' => 'Updated chore', 'points_value' => 15, 'category' => 'quick', 'emoji' => '🚿']);

        $this->actingAs($parent)
            ->deleteJson("/api/chores/{$chore->id}")
            ->assertOk();

        $this->assertDatabaseMissing('chores', ['id' => $chore->id]);
    }

    public function test_teen_cannot_access_chore_management(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);

        $this->actingAs($teen)
            ->postJson('/api/chores', [
                'title' => 'Nope',
                'points_value' => 5,
                'recurrence_type' => 'weekly',
                'active' => true,
            ])
            ->assertStatus(403);
    }
}
