<?php

namespace Tests\Feature;

use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\UniFiSyncLog;
use App\Models\User;
use App\Services\UniFiService;
use Tests\TestCase;

class UniFiRewardRedemptionTest extends TestCase
{

    private UniFiService $unifiService;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a mock UniFiService for testing
        $this->unifiService = $this->mock(UniFiService::class);
        $this->app->instance(UniFiService::class, $this->unifiService);
    }

    public function test_teen_can_redeem_reward_and_receive_unifi_voucher(): void
    {
        $teen = User::factory()->create(['role' => 'teen', 'points_balance' => 100]);
        $reward = Reward::factory()->create(['points_cost' => 50, 'type' => 'wifi', 'duration_minutes' => 60]);

        // Mock successful voucher generation
        $this->unifiService
            ->shouldReceive('generateVoucher')
            ->with(60, null)
            ->andReturn([
                'code' => 'ABC123DEF456',
                'expires_at' => now()->addHours(1),
            ]);

        $response = $this->actingAs($teen)
            ->postJson("/api/rewards/{$reward->id}/redeem")
            ->assertCreated();

        // Verify response contains voucher details
        $response->assertJsonStructure([
            'message',
            'voucherCode',
            'voucherExpiresAt',
        ]);

        // Verify points were deducted
        $this->assertEquals(50, $teen->fresh()->points_balance);

        // Verify RewardRedemption was created with voucher details
        $this->assertDatabaseHas('reward_redemptions', [
            'user_id' => $teen->id,
            'reward_id' => $reward->id,
            'voucher_code' => 'ABC123DEF456',
            'unifi_sync_status' => 'synced',
        ]);

        // Verify UniFiSyncLog was created
        $this->assertDatabaseHas('unifi_sync_logs', [
            'status' => 'success',
        ]);
    }

    public function test_teen_points_refunded_if_unifi_voucher_generation_fails(): void
    {
        $teen = User::factory()->create(['role' => 'teen', 'points_balance' => 100]);
        $reward = Reward::factory()->create(['points_cost' => 50, 'type' => 'wifi', 'duration_minutes' => 60]);

        // Mock failed voucher generation
        $this->unifiService
            ->shouldReceive('generateVoucher')
            ->with(60, null)
            ->andThrow(new \Exception('UniFi controller unreachable'));

        $response = $this->actingAs($teen)
            ->postJson("/api/rewards/{$reward->id}/redeem")
            ->assertUnprocessable();

        // Verify points were refunded
        $this->assertEquals(100, $teen->fresh()->points_balance);

        // Verify RewardRedemption has failed status
        $this->assertDatabaseHas('reward_redemptions', [
            'user_id' => $teen->id,
            'reward_id' => $reward->id,
            'unifi_sync_status' => 'failed',
        ]);

        // Verify UniFiSyncLog records the failure
        $this->assertDatabaseHas('unifi_sync_logs', [
            'status' => 'failure',
        ]);
    }

    public function test_teen_cannot_redeem_without_sufficient_points(): void
    {
        $teen = User::factory()->create(['role' => 'teen', 'points_balance' => 30]);
        $reward = Reward::factory()->create(['points_cost' => 50, 'type' => 'wifi']);

        $this->actingAs($teen)
            ->postJson("/api/rewards/{$reward->id}/redeem")
            ->assertUnprocessable();

        // Verify no redemption was created
        $this->assertDatabaseMissing('reward_redemptions', [
            'user_id' => $teen->id,
            'reward_id' => $reward->id,
        ]);

        // Verify no UniFi call was made (no sync log)
        $this->assertEquals(0, UniFiSyncLog::count());
    }

    public function test_parent_cannot_redeem_rewards(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $reward = Reward::factory()->create(['type' => 'wifi']);

        $this->actingAs($parent)
            ->postJson("/api/rewards/{$reward->id}/redeem")
            ->assertForbidden();
    }

    public function test_unifi_voucher_includes_duration_from_reward(): void
    {
        $teen = User::factory()->create(['role' => 'teen', 'points_balance' => 100]);
        $reward = Reward::factory()->create(['points_cost' => 50, 'type' => 'wifi', 'duration_minutes' => 120]);

        // Verify the service is called with the reward's duration
        $this->unifiService
            ->shouldReceive('generateVoucher')
            ->with(120, null) // duration_minutes should be passed
            ->andReturn([
                'code' => 'XYZ789',
                'expires_at' => now()->addMinutes(120),
            ]);

        $this->actingAs($teen)
            ->postJson("/api/rewards/{$reward->id}/redeem")
            ->assertCreated();
    }
}
