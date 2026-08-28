<?php

namespace Tests\Feature;

use App\Models\Reward;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RewardManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_parent_can_create_edit_and_delete_reward(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);

        $this->actingAs($parent)
            ->postJson('/api/rewards', [
                'name' => 'Screen time 30 min',
                'type' => 'wifi',
                'points_cost' => 60,
                'duration_minutes' => 30,
                'emoji' => '📺',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('rewards', ['name' => 'Screen time 30 min', 'points_cost' => 60, 'emoji' => '📺', 'type' => 'wifi']);

        $reward = Reward::first();

        $this->actingAs($parent)
            ->putJson("/api/rewards/{$reward->id}", [
                'name' => 'Movie night',
                'type' => 'physical',
                'points_cost' => 120,
                'emoji' => '🎬',
            ])
            ->assertOk();

        $this->assertDatabaseHas('rewards', ['name' => 'Movie night', 'points_cost' => 120, 'emoji' => '🎬', 'type' => 'physical']);

        $this->actingAs($parent)
            ->deleteJson("/api/rewards/{$reward->id}")
            ->assertOk();

        $this->assertDatabaseMissing('rewards', ['id' => $reward->id]);
    }

    public function test_teen_cannot_access_reward_management(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);
        $reward = Reward::factory()->create();

        $this->actingAs($teen)
            ->postJson('/api/rewards', [
                'name' => 'Nope',
                'type' => 'wifi',
                'points_cost' => 20,
                'duration_minutes' => 10,
            ])
            ->assertStatus(403);

        $this->actingAs($teen)
            ->putJson("/api/rewards/{$reward->id}", [
                'name' => 'Nope update',
                'type' => 'wifi',
                'points_cost' => 25,
                'duration_minutes' => 10,
            ])
            ->assertStatus(403);

        $this->actingAs($teen)
            ->deleteJson("/api/rewards/{$reward->id}")
            ->assertStatus(403);
    }
}
