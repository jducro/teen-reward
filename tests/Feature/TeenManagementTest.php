<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class TeenManagementTest extends TestCase
{
    public function test_parent_can_survey_teen_accounts_and_points_from_bootstrap_payload(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);

        $teenOne = User::factory()->create([
            'name' => 'Alex Teen',
            'role' => 'teen',
            'points_balance' => 35,
        ]);
        $teenTwo = User::factory()->create([
            'name' => 'Zoey Teen',
            'role' => 'teen',
            'points_balance' => 90,
        ]);

        $response = $this->actingAs($parent)->getJson('/api/bootstrap');

        $response
            ->assertOk()
            ->assertJsonFragment([
                'id' => $teenOne->id,
                'name' => 'Alex Teen',
                'email' => $teenOne->email,
                'pointsBalance' => 35,
            ])
            ->assertJsonFragment([
                'id' => $teenTwo->id,
                'name' => 'Zoey Teen',
                'email' => $teenTwo->email,
                'pointsBalance' => 90,
            ]);
    }

    public function test_parent_can_update_a_teen_points_balance(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $teen = User::factory()->create([
            'role' => 'teen',
            'points_balance' => 10,
        ]);

        $this->actingAs($parent)
            ->putJson("/api/teens/{$teen->id}", [
                'name' => 'Teen Updated',
                'email' => 'teen-updated@example.com',
                'points_balance' => 125,
                'password' => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ])
            ->assertOk()
            ->assertJsonPath('message', __('messages.teen.updated'));

        $this->assertDatabaseHas('users', [
            'id' => $teen->id,
            'name' => 'Teen Updated',
            'email' => 'teen-updated@example.com',
            'points_balance' => 125,
        ]);
    }

    public function test_non_parent_cannot_manage_teen_points(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);
        $otherTeen = User::factory()->create([
            'role' => 'teen',
            'points_balance' => 15,
        ]);

        $this->actingAs($teen)
            ->postJson('/api/teens', [
                'name' => 'No Access Teen',
                'email' => 'no-access-teen@example.com',
                'points_balance' => 50,
                'password' => 'password-123',
                'password_confirmation' => 'password-123',
            ])
            ->assertStatus(403);

        $this->actingAs($teen)
            ->putJson("/api/teens/{$otherTeen->id}", [
                'name' => 'Still No Access',
                'email' => 'still-no-access@example.com',
                'points_balance' => 99,
            ])
            ->assertStatus(403);

        $this->actingAs($teen)
            ->patchJson("/api/teens/{$otherTeen->id}/points", [
                'points_balance' => 99,
            ])
            ->assertStatus(403);
    }

    public function test_parent_can_create_a_teen_account(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);

        $this->actingAs($parent)
            ->postJson('/api/teens', [
                'name' => 'New Teen',
                'email' => 'new-teen@example.com',
                'points_balance' => 20,
                'password' => 'password-123',
                'password_confirmation' => 'password-123',
            ])
            ->assertCreated()
            ->assertJsonPath('message', __('messages.teen.created'));

        $this->assertDatabaseHas('users', [
            'name' => 'New Teen',
            'email' => 'new-teen@example.com',
            'role' => 'teen',
            'points_balance' => 20,
        ]);
    }

    public function test_parent_can_delete_a_teen_account(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $teen = User::factory()->create(['role' => 'teen']);

        $this->actingAs($parent)
            ->deleteJson("/api/teens/{$teen->id}")
            ->assertOk()
            ->assertJsonPath('message', __('messages.teen.deleted'));

        $this->assertDatabaseMissing('users', [
            'id' => $teen->id,
        ]);
    }

    public function test_non_parent_cannot_delete_teen(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);
        $otherTeen = User::factory()->create(['role' => 'teen']);

        $this->actingAs($teen)
            ->deleteJson("/api/teens/{$otherTeen->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('users', [
            'id' => $otherTeen->id,
        ]);
    }

    public function test_parent_cannot_delete_non_teen_user(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $otherParent = User::factory()->create(['role' => 'parent']);

        $this->actingAs($parent)
            ->deleteJson("/api/teens/{$otherParent->id}")
            ->assertStatus(404);

        $this->assertDatabaseHas('users', [
            'id' => $otherParent->id,
        ]);
    }
}
