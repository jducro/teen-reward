<?php

namespace Tests\Feature;

use App\Models\DeviceAccessGrant;
use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\User;
use App\Models\UserDevice;
use App\Services\UniFiService;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ExternalPortalTest extends TestCase
{
    use RefreshDatabase;

    private const MAC = 'aa:bb:cc:dd:ee:ff';

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(PreventRequestForgery::class);
        config(['services.unifi.portal_ssid' => 'Family Guest']);
        $this->app->instance(UniFiService::class, $this->fakeUniFiService());
    }

    public function test_external_redirect_context_must_match_configured_ssid_and_connected_client(): void
    {
        $this->get('/portal?id='.self::MAC.'&ssid=Wrong%20Network')
            ->assertOk()
            ->assertSee('n’avons pas pu vérifier cette connexion');

        $this->get('/portal?id=not-a-mac&ssid=Family%20Guest')
            ->assertOk()
            ->assertSee('n’avons pas pu vérifier cette connexion');

        $this->get('/portal?id='.self::MAC.'&ssid=Family%20Guest')
            ->assertRedirect(route('portal.show'));

        $this->get('/portal')
            ->assertOk()
            ->assertSee('Connectez-vous avec votre compte ado')
            ->assertSee('<html lang="fr">', false);
    }

    public function test_unifi_generated_site_path_is_served_and_keeps_the_portal_path_for_login(): void
    {
        $externalPortalUrl = '/guest/s/default/?id='.self::MAC.'&ssid=Family%20Guest&ap=11:22:33:44:55:66&t=1742398732&url=http%3A%2F%2Fexample.com';

        $this->get($externalPortalUrl)->assertRedirect(route('portal.external.show', ['site' => 'default']));
        $this->get(route('portal.external.show', ['site' => 'default']))
            ->assertOk()
            ->assertSee(route('portal.external.login', ['site' => 'default']), false);

        $this->get('/guest/s/other-site/?id='.self::MAC.'&ssid=Family%20Guest')
            ->assertOk()
            ->assertSee('n’avons pas pu vérifier cette connexion');
    }

    public function test_portal_does_not_claim_a_device_registered_to_another_teen(): void
    {
        $this->enterPortal();
        $teen = User::factory()->create(['role' => 'teen', 'points_balance' => 100]);
        $otherTeen = User::factory()->create(['role' => 'teen']);
        $reward = Reward::factory()->create(['name' => 'One hour', 'points_cost' => 20]);
        UserDevice::create(['user_id' => $otherTeen->id, 'mac_address' => self::MAC, 'status' => 'active']);

        $this->actingAs($teen)->get('/portal')
            ->assertOk()
            ->assertSee('déjà associé à un autre compte');

        UserDevice::query()->where('mac_address', self::MAC)->update(['user_id' => $teen->id]);
        $this->get('/portal')->assertOk()->assertSee($reward->name)->assertSee('100 points');
    }

    public function test_authenticated_teen_must_confirm_before_the_verified_portal_device_is_registered(): void
    {
        $this->enterPortal();
        $teen = User::factory()->create(['role' => 'teen', 'points_balance' => 40]);
        $reward = Reward::factory()->create(['type' => 'wifi', 'name' => 'One hour']);

        $this->actingAs($teen)->get('/portal')
            ->assertOk()
            ->assertSee(__('portal.current_account', ['email' => $teen->email]))
            ->assertSee(__('portal.confirm_device_action'))
            ->assertSee(__('portal.logout_action'))
            ->assertSee(self::MAC);

        $this->assertDatabaseMissing('user_devices', ['mac_address' => self::MAC]);

        $this->post('/portal/device/confirm')->assertRedirect(route('portal.show'));
        $this->get('/portal')->assertOk()->assertSee('One hour')->assertSee(self::MAC);

        $this->assertDatabaseHas('user_devices', [
            'user_id' => $teen->id,
            'mac_address' => self::MAC,
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('device_events', [
            'user_id' => $teen->id,
            'actor_id' => $teen->id,
            'mac_address' => self::MAC,
            'action' => 'portal_registered',
        ]);
    }

    public function test_portal_waits_for_unifi_to_index_the_guest_client_before_registering_it(): void
    {
        $service = $this->fakeUniFiService();
        $service->clientAvailable = false;
        $this->app->instance(UniFiService::class, $service);
        $this->enterPortal();
        $teen = User::factory()->create(['role' => 'teen']);
        Reward::factory()->create(['type' => 'wifi', 'name' => 'One hour']);

        $this->actingAs($teen)->get('/portal')
            ->assertOk()
            ->assertSee(__('portal.client_pending'))
            ->assertSee('http-equiv="refresh" content="3"', false);

        $this->assertDatabaseMissing('user_devices', ['mac_address' => self::MAC]);

        $service->clientAvailable = true;
        $this->get('/portal')
            ->assertOk()
            ->assertSee(__('portal.confirm_device_action'))
            ->assertSee(self::MAC);

        $this->assertDatabaseMissing('user_devices', ['mac_address' => self::MAC]);

        $this->post('/portal/device/confirm')->assertRedirect(route('portal.show'));

        $this->assertDatabaseHas('user_devices', [
            'user_id' => $teen->id,
            'mac_address' => self::MAC,
            'status' => 'active',
        ]);
    }

    public function test_teen_can_sign_out_before_confirming_and_portal_context_is_preserved(): void
    {
        $this->enterPortal();
        $firstTeen = User::factory()->create([
            'role' => 'teen',
            'email' => 'first-teen@example.com',
            'password' => 'teen-password',
        ]);
        $secondTeen = User::factory()->create([
            'role' => 'teen',
            'email' => 'second-teen@example.com',
            'password' => 'teen-password',
        ]);

        $this->actingAs($firstTeen)->get('/portal')
            ->assertOk()
            ->assertSee(__('portal.current_account', ['email' => $firstTeen->email]))
            ->assertSee(__('portal.logout_action'));

        $this->post('/portal/logout')->assertRedirect(route('portal.show'));
        $this->get('/portal')->assertOk()->assertSee(__('portal.sign_in_intro', ['ssid' => 'Family Guest']));
        $this->assertDatabaseMissing('user_devices', ['mac_address' => self::MAC]);

        $this->post('/portal/login', ['email' => $secondTeen->email, 'password' => 'teen-password'])
            ->assertRedirect(route('portal.show'));
        $this->get('/portal')
            ->assertOk()
            ->assertSee(__('portal.current_account', ['email' => $secondTeen->email]))
            ->assertSee(__('portal.confirm_device_action'));
    }

    public function test_portal_login_keeps_the_captive_context_and_rejects_parent_accounts(): void
    {
        $this->enterPortal();
        $teen = User::factory()->create([
            'role' => 'teen',
            'password' => 'teen-password',
            'points_balance' => 30,
        ]);
        UserDevice::create(['user_id' => $teen->id, 'mac_address' => self::MAC, 'status' => 'active']);
        Reward::factory()->create(['name' => 'Wi-Fi reward']);

        $parent = User::factory()->create(['role' => 'parent', 'password' => 'parent-password']);
        $this->post('/portal/login', ['email' => $parent->email, 'password' => 'parent-password'])
            ->assertRedirect(route('portal.show'));
        $this->get('/portal')->assertOk()->assertSee('réservé aux comptes ado');

        $this->post('/portal/login', ['email' => $teen->email, 'password' => 'teen-password'])
            ->assertRedirect(route('portal.show'));
        $this->get('/portal')->assertOk()->assertSee('Wi-Fi reward')->assertSee('30 points');
    }

    public function test_portal_page_uses_the_selected_application_locale(): void
    {
        config(['app.locale' => 'en']);

        $this->get('/portal?id='.self::MAC.'&ssid=Wrong%20Network')
            ->assertOk()
            ->assertSee('<html lang="en">', false)
            ->assertSee('We could not verify this connection');
    }

    public function test_teen_can_redeem_wifi_reward_for_a_finite_device_grant(): void
    {
        $service = $this->fakeUniFiService();
        $this->app->instance(UniFiService::class, $service);
        $this->enterPortal();
        $teen = User::factory()->create(['role' => 'teen', 'points_balance' => 100]);
        $reward = Reward::factory()->create(['type' => 'wifi', 'points_cost' => 25, 'duration_minutes' => 60]);
        $requestKey = (string) Str::uuid();

        $this->actingAs($teen)->get('/portal')->assertOk()->assertSee(__('portal.confirm_device_action'));
        $this->post('/portal/device/confirm')->assertRedirect(route('portal.show'));

        $this->actingAs($teen)->post('/portal/redeem', [
            'reward_id' => $reward->id,
            'request_key' => $requestKey,
        ])->assertRedirect(route('portal.show'))->assertSessionHas('status');

        $this->assertSame(75, $teen->fresh()->points_balance);
        $device = UserDevice::query()->where('user_id', $teen->id)->where('mac_address', self::MAC)->sole();
        $redemption = RewardRedemption::query()->sole();
        $this->assertSame($device->id, $redemption->user_device_id);
        $this->assertSame(self::MAC, $redemption->device_mac);
        $this->assertSame('fulfilled', $redemption->status);
        $this->assertSame('synced', $redemption->unifi_sync_status);
        $this->assertTrue($redemption->access_expires_at->between(now()->addMinutes(59), now()->addMinutes(61)));
        $this->assertSame([[self::MAC, 60, null]], $service->authorizations);
        $this->assertDatabaseHas('unifi_sync_logs', ['redemption_id' => $redemption->id, 'status' => 'success']);
        $this->assertDatabaseHas('device_events', [
            'user_id' => $teen->id,
            'mac_address' => self::MAC,
            'action' => 'portal_registered',
        ]);
    }

    public function test_one_wifi_redemption_authorizes_all_approved_devices_to_the_same_expiry(): void
    {
        $service = $this->fakeUniFiService();
        $this->app->instance(UniFiService::class, $service);
        $this->enterPortal();
        $teen = User::factory()->create(['role' => 'teen', 'points_balance' => 100]);
        UserDevice::create(['user_id' => $teen->id, 'mac_address' => self::MAC, 'status' => 'active']);
        UserDevice::create(['user_id' => $teen->id, 'mac_address' => 'aa:bb:cc:dd:ee:01', 'status' => 'active', 'bandwidth_limit' => 1024]);
        UserDevice::create(['user_id' => $teen->id, 'mac_address' => 'aa:bb:cc:dd:ee:02', 'status' => 'pending_approval']);
        $reward = Reward::factory()->create(['type' => 'wifi', 'points_cost' => 25, 'duration_minutes' => 60]);

        $this->actingAs($teen)->post('/portal/redeem', [
            'reward_id' => $reward->id,
            'request_key' => (string) Str::uuid(),
        ])->assertRedirect(route('portal.show'));

        $redemption = RewardRedemption::query()->sole();
        $this->assertSame(75, $teen->fresh()->points_balance);
        $this->assertEqualsCanonicalizing([
            [self::MAC, 60, null],
            ['aa:bb:cc:dd:ee:01', 60, 1024],
        ], $service->authorizations);
        $this->assertSame(2, DeviceAccessGrant::query()->where('reward_redemption_id', $redemption->id)->where('status', 'synced')->count());
        $this->assertSame(0, DeviceAccessGrant::query()->where('mac_address', 'aa:bb:cc:dd:ee:02')->count());
        $this->assertEquals($redemption->access_expires_at, DeviceAccessGrant::query()->where('mac_address', 'aa:bb:cc:dd:ee:01')->sole()->access_expires_at);
    }

    public function test_approved_device_can_reuse_active_teen_session_without_another_charge(): void
    {
        $service = $this->fakeUniFiService();
        $this->app->instance(UniFiService::class, $service);
        $this->enterPortal();
        $teen = User::factory()->create(['role' => 'teen', 'points_balance' => 100]);
        UserDevice::create(['user_id' => $teen->id, 'mac_address' => self::MAC, 'status' => 'active']);
        $secondDevice = UserDevice::create(['user_id' => $teen->id, 'mac_address' => 'aa:bb:cc:dd:ee:03', 'status' => 'active']);
        $reward = Reward::factory()->create(['type' => 'wifi', 'points_cost' => 25, 'duration_minutes' => 60]);
        $this->actingAs($teen)->post('/portal/redeem', ['reward_id' => $reward->id, 'request_key' => (string) Str::uuid()]);
        $initialBalance = $teen->fresh()->points_balance;
        $countAfterPurchase = count($service->authorizations);

        $this->get('/portal?id='.$secondDevice->mac_address.'&ssid=Family%20Guest')->assertRedirect(route('portal.show'));
        $this->get('/portal')->assertOk()->assertSee('L’accès Wi-Fi est actif');

        $this->assertSame($initialBalance, $teen->fresh()->points_balance);
        $this->assertSame($countAfterPurchase, count($service->authorizations));
        $this->assertDatabaseHas('device_access_grants', [
            'user_id' => $teen->id,
            'mac_address' => $secondDevice->mac_address,
            'source' => 'shared_reward',
            'status' => 'synced',
        ]);
    }

    public function test_newly_approved_device_receives_remaining_time_of_active_session(): void
    {
        $service = $this->fakeUniFiService();
        $this->app->instance(UniFiService::class, $service);
        $teen = User::factory()->create(['role' => 'teen']);
        $parent = User::factory()->create(['role' => 'parent']);
        $device = UserDevice::create(['user_id' => $teen->id, 'mac_address' => 'aa:bb:cc:dd:ee:04', 'status' => 'pending_approval']);
        $reward = Reward::factory()->create(['type' => 'wifi', 'duration_minutes' => 60]);
        $redemption = RewardRedemption::create([
            'user_id' => $teen->id,
            'reward_id' => $reward->id,
            'status' => 'fulfilled',
            'unifi_sync_status' => 'synced',
            'redeemed_at' => now()->subMinutes(20),
            'access_expires_at' => now()->addMinutes(40),
        ]);

        $this->actingAs($parent)->putJson("/api/devices/{$device->id}/approve")->assertOk();

        $this->assertCount(1, $service->authorizations);
        $this->assertSame('aa:bb:cc:dd:ee:04', $service->authorizations[0][0]);
        $this->assertLessThanOrEqual(40, $service->authorizations[0][1]);
        $this->assertGreaterThanOrEqual(39, $service->authorizations[0][1]);
        $this->assertDatabaseHas('device_access_grants', [
            'reward_redemption_id' => $redemption->id,
            'device_id' => $device->id,
            'source' => 'device_approval',
            'status' => 'synced',
        ]);
    }

    public function test_repeated_request_key_does_not_charge_points_or_authorize_twice(): void
    {
        $service = $this->fakeUniFiService();
        $this->app->instance(UniFiService::class, $service);
        $this->enterPortal();
        $teen = User::factory()->create(['role' => 'teen', 'points_balance' => 50]);
        UserDevice::create(['user_id' => $teen->id, 'mac_address' => self::MAC, 'status' => 'active']);
        $reward = Reward::factory()->create(['points_cost' => 20]);
        $requestKey = (string) Str::uuid();
        $payload = ['reward_id' => $reward->id, 'request_key' => $requestKey];

        $this->actingAs($teen)->post('/portal/redeem', $payload)->assertRedirect(route('portal.show'));
        $this->post('/portal/redeem', $payload)->assertRedirect(route('portal.show'));

        $this->assertSame(30, $teen->fresh()->points_balance);
        $this->assertSame(1, RewardRedemption::query()->count());
        $this->assertCount(1, $service->authorizations);
    }

    public function test_insufficient_points_and_non_wifi_rewards_never_authorize_a_device(): void
    {
        $service = $this->fakeUniFiService();
        $this->app->instance(UniFiService::class, $service);
        $this->enterPortal();
        $teen = User::factory()->create(['role' => 'teen', 'points_balance' => 2]);
        UserDevice::create(['user_id' => $teen->id, 'mac_address' => self::MAC, 'status' => 'active']);
        $wifiReward = Reward::factory()->create(['points_cost' => 20]);
        $physicalReward = Reward::factory()->physical()->create();

        $this->actingAs($teen)->post('/portal/redeem', ['reward_id' => $wifiReward->id, 'request_key' => (string) Str::uuid()])
            ->assertRedirect(route('portal.show'))->assertSessionHasErrors('reward');
        $this->post('/portal/redeem', ['reward_id' => $physicalReward->id, 'request_key' => (string) Str::uuid()])
            ->assertNotFound();

        $this->assertSame(2, $teen->fresh()->points_balance);
        $this->assertSame(0, RewardRedemption::query()->count());
        $this->assertCount(0, $service->authorizations);
    }

    public function test_failed_unifi_authorization_marks_redemption_failed_and_refunds_points(): void
    {
        $service = $this->fakeUniFiService();
        $service->failAuthorization = true;
        $this->app->instance(UniFiService::class, $service);
        $this->enterPortal();
        $teen = User::factory()->create(['role' => 'teen', 'points_balance' => 50]);
        UserDevice::create(['user_id' => $teen->id, 'mac_address' => self::MAC, 'status' => 'active']);
        $reward = Reward::factory()->create(['points_cost' => 20]);

        $this->actingAs($teen)->post('/portal/redeem', ['reward_id' => $reward->id, 'request_key' => (string) Str::uuid()])
            ->assertRedirect(route('portal.show'))->assertSessionHasErrors('portal');

        $this->assertSame(50, $teen->fresh()->points_balance);
        $this->assertDatabaseHas('reward_redemptions', ['user_id' => $teen->id, 'status' => 'failed', 'unifi_sync_status' => 'failed']);
        $this->assertDatabaseHas('unifi_sync_logs', ['status' => 'failure']);
    }

    private function enterPortal(): void
    {
        $this->get('/portal?id='.self::MAC.'&ssid=Family%20Guest')->assertRedirect(route('portal.show'));
    }

    private function fakeUniFiService(): UniFiService
    {
        return new class extends UniFiService
        {
            /** @var array<int, array{0: string, 1: int, 2: int|null}> */
            public array $authorizations = [];

            public bool $failAuthorization = false;

            public bool $clientAvailable = true;

            public function getConnectedClient(string $deviceMac): ?array
            {
                if (! $this->clientAvailable) {
                    return null;
                }

                return ['mac' => $deviceMac, 'ssid' => 'Family Guest', 'ap_mac' => '11:22:33:44:55:66'];
            }

            public function authorizeDeviceForDuration(string $deviceMac, int $minutes, ?int $bandwidth = null): bool
            {
                $this->authorizations[] = [$deviceMac, $minutes, $bandwidth];
                if ($this->failAuthorization) {
                    throw new \RuntimeException('controller unavailable');
                }

                return true;
            }
        };
    }
}
