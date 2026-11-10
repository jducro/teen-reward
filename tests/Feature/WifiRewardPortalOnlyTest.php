<?php

namespace Tests\Feature;

use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WifiRewardPortalOnlyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(PreventRequestForgery::class);
    }

    public function test_wifi_reward_cannot_be_redeemed_in_the_app_when_the_portal_is_configured(): void
    {
        config(['services.unifi.portal_ssid' => 'Family Guest']);
        $teen = User::factory()->create(['role' => 'teen', 'points_balance' => 100]);
        $reward = Reward::factory()->create(['type' => 'wifi', 'points_cost' => 20, 'duration_minutes' => 60]);

        $this->actingAs($teen)->postJson("/api/rewards/{$reward->id}/redeem")
            ->assertStatus(422)
            ->assertJson(['message' => __('messages.reward.use_portal')]);

        $this->assertSame(100, $teen->fresh()->points_balance);
        $this->assertSame(0, RewardRedemption::query()->count());
    }

    public function test_physical_reward_can_still_be_redeemed_in_the_app(): void
    {
        config(['services.unifi.portal_ssid' => 'Family Guest']);
        $teen = User::factory()->create(['role' => 'teen', 'points_balance' => 100]);
        $reward = Reward::factory()->physical()->create(['points_cost' => 20]);

        $this->actingAs($teen)->postJson("/api/rewards/{$reward->id}/redeem")
            ->assertCreated();

        $this->assertSame(80, $teen->fresh()->points_balance);
    }

    public function test_bootstrap_flags_wifi_rewards_as_portal_only_only_when_the_portal_is_configured(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);
        Reward::factory()->create(['type' => 'wifi']);

        config(['services.unifi.portal_ssid' => 'Family Guest']);
        $this->actingAs($teen)->getJson('/api/bootstrap')
            ->assertJsonPath('rewards.0.portalOnly', true);

        config(['services.unifi.portal_ssid' => null]);
        $this->actingAs($teen)->getJson('/api/bootstrap')
            ->assertJsonPath('rewards.0.portalOnly', false);
    }
}
