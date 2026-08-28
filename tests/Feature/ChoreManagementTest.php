<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chore;

class ChoreManagementTest extends TestCase
{

    public function test_parent_can_create_edit_and_delete_chore(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);

        $this->actingAs($parent)
            ->postJson('/api/chores', [
                'title' => 'Test chore',
                'description' => 'Do stuff',
                'points_value' => 10,
                'emoji' => '🧺',
                'recurrence_type' => 'weekly',
                'active' => true,
            ])
            ->assertCreated();

        $this->assertDatabaseHas('chores', ['title' => 'Test chore', 'emoji' => '🧺', 'created_by' => $parent->id]);

        $chore = Chore::first();

        $this->actingAs($parent)
            ->putJson("/api/chores/{$chore->id}", [
                'title' => 'Updated chore',
                'description' => 'Updated',
                'points_value' => 15,
                'emoji' => '🚿',
                'recurrence_type' => 'weekly',
                'active' => true,
            ])
            ->assertOk();

        $this->assertDatabaseHas('chores', ['title' => 'Updated chore', 'points_value' => 15, 'emoji' => '🚿']);

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
