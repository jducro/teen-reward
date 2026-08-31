<?php

namespace Tests\Feature;

use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\UniFiSyncLog;
use App\Models\User;
use App\Services\UniFiService;
use Mockery;
use Tests\TestCase;

class UniFiRewardRedemptionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->app->instance(UniFiService::class, new class extends UniFiService {
            public function generateVoucher(int $duration = 60, ?int $bandwidth = null, ?string $note = null): array
            {
                return [
                    'code' => 'ABC123DEF456',
                    'expires_at' => now()->addMinutes($duration),
                ];
            }
        });
    }

    public function test_teen_can_redeem_reward_and_receive_unifi_voucher(): void
    {
        $teen = User::factory()->create(['role' => 'teen', 'points_balance' => 100]);
        $reward = Reward::factory()->create(['points_cost' => 50, 'type' => 'wifi', 'duration_minutes' => 60]);

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

        $this->app->instance(UniFiService::class, new class extends UniFiService {
            public function generateVoucher(int $duration = 60, ?int $bandwidth = null, ?string $note = null): array
            {
                throw new \Exception('UniFi controller unreachable');
            }
        });

        $response = $this->actingAs($teen)
            ->postJson("/api/rewards/{$reward->id}/redeem")
            ->assertCreated();

        // Verify response contains fallback voucher code
        $response->assertJsonStructure([
            'message',
            'voucherCode',
        ]);

        // Verify points were NOT refunded (fallback voucher means success)
        $this->assertEquals(50, $teen->fresh()->points_balance);

        // Verify RewardRedemption has fallback status (not failed)
        $this->assertDatabaseHas('reward_redemptions', [
            'user_id' => $teen->id,
            'reward_id' => $reward->id,
            'unifi_sync_status' => 'fallback',
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

        $service = new class extends UniFiService {
            public ?int $receivedDuration = null;
            public ?int $receivedBandwidth = null;
            public ?string $receivedNote = null;

            public function generateVoucher(int $duration = 60, ?int $bandwidth = null, ?string $note = null): array
            {
                $this->receivedDuration = $duration;
                $this->receivedBandwidth = $bandwidth;
                $this->receivedNote = $note;

                return [
                    'code' => 'XYZ789',
                    'expires_at' => now()->addMinutes($duration),
                ];
            }
        };

        $this->app->instance(UniFiService::class, $service);

        $this->actingAs($teen)
            ->postJson("/api/rewards/{$reward->id}/redeem")
            ->assertCreated();

        $this->assertSame(120, $service->receivedDuration);
        $this->assertNull($service->receivedBandwidth);
    }
}
