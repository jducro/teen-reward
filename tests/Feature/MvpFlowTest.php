<?php

namespace Tests\Feature;

use App\Models\Chore;
use App\Models\ChoreClaim;
use App\Models\Reward;
use App\Models\User;
use App\Services\UniFiService;
use Tests\TestCase;

class MvpFlowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Mock UniFiService for this test
        $unifiService = $this->mock(UniFiService::class);
        $unifiService
            ->shouldReceive('generateVoucher')
            ->andReturn([
                'code' => 'TEST-VOUCHER-123',
                'expires_at' => now()->addHours(1),
            ]);

        $this->app->instance(UniFiService::class, $unifiService);
    }

    public function test_parent_can_approve_a_chore_and_teen_can_redeem_a_voucher_reward(): void
    {
        $parent = User::factory()->create([
            'role' => 'parent',
            'points_balance' => 0,
        ]);

        $teen = User::factory()->create([
            'role' => 'teen',
            'points_balance' => 0,
        ]);

        $chore = Chore::factory()->create([
            'title' => 'Clean room',
            'points_value' => 15,
            'created_by' => $parent->id,
        ]);

        $reward = Reward::factory()->create([
            'name' => '1 hour internet',
            'type' => 'wifi',
            'points_cost' => 15,
            'duration_minutes' => 60,
        ]);

        $this->actingAs($teen)
            ->postJson("/api/chores/{$chore->id}/claim")
            ->assertCreated();

        $this->assertDatabaseHas('chore_claims', [
            'chore_id' => $chore->id,
            'user_id' => $teen->id,
            'status' => 'pending',
        ]);

        $claim = ChoreClaim::first();

        $this->actingAs($parent)
            ->postJson("/api/claims/{$claim->id}/approve")
            ->assertOk();

        $teen->refresh();
        $this->assertSame(15, $teen->points_balance);

        $this->actingAs($teen)
            ->postJson("/api/rewards/{$reward->id}/redeem")
            ->assertCreated();

        $this->assertDatabaseHas('reward_redemptions', [
            'user_id' => $teen->id,
            'reward_id' => $reward->id,
            'status' => 'fulfilled',
        ]);

        $this->assertDatabaseHas('reward_redemptions', [
            'user_id' => $teen->id,
            'reward_id' => $reward->id,
            'voucher_code' => 'TEST-VOUCHER-123',
            'unifi_sync_status' => 'synced',
        ]);
    }

    public function test_parent_can_create_claim_for_teen_with_immediate_approval(): void
    {
        $parent = User::factory()->create([
            'role' => 'parent',
            'points_balance' => 0,
        ]);

        $teen = User::factory()->create([
            'role' => 'teen',
            'points_balance' => 0,
        ]);

        $chore = Chore::factory()->create([
            'title' => 'Wash dishes',
            'points_value' => 10,
            'created_by' => $parent->id,
        ]);

        $this->actingAs($parent)
            ->postJson("/api/chores/{$chore->id}/claim-for-teen", [
                'teen_id' => $teen->id,
            ])
            ->assertCreated();

        $this->assertDatabaseHas('chore_claims', [
            'chore_id' => $chore->id,
            'user_id' => $teen->id,
            'status' => 'approved',
            'points_awarded' => 10,
        ]);

        $teen->refresh();
        $this->assertSame(10, $teen->points_balance);
    }

    public function test_parent_cannot_create_claim_twice_for_same_period(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $teen = User::factory()->create(['role' => 'teen']);
        $chore = Chore::factory()->create([
            'points_value' => 10,
            'created_by' => $parent->id,
        ]);

        $this->actingAs($parent)
            ->postJson("/api/chores/{$chore->id}/claim-for-teen", [
                'teen_id' => $teen->id,
            ])
            ->assertCreated();

        $this->actingAs($parent)
            ->postJson("/api/chores/{$chore->id}/claim-for-teen", [
                'teen_id' => $teen->id,
            ])
            ->assertUnprocessable();
    }

    public function test_only_parent_can_create_claim_for_teen(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $teen = User::factory()->create(['role' => 'teen']);
        $other_teen = User::factory()->create(['role' => 'teen']);

        $chore = Chore::factory()->create([
            'points_value' => 10,
            'created_by' => $parent->id,
        ]);

        $this->actingAs($teen)
            ->postJson("/api/chores/{$chore->id}/claim-for-teen", [
                'teen_id' => $other_teen->id,
            ])
            ->assertForbidden();
    }

    public function test_parent_must_provide_valid_teen_id(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $chore = Chore::factory()->create([
            'points_value' => 10,
            'created_by' => $parent->id,
        ]);

        $this->actingAs($parent)
            ->postJson("/api/chores/{$chore->id}/claim-for-teen", [
                'teen_id' => 99999,
            ])
            ->assertUnprocessable();
    }
}
