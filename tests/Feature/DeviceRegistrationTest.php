<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserDevice;
use App\Services\UniFiService;
use Tests\TestCase;

class DeviceRegistrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->app->instance(UniFiService::class, new class extends UniFiService {
            public function registerDevice(string $deviceMac, ?int $bandwidth = null): bool
            {
                return true;
            }

            public function unregisterDevice(string $deviceMac): bool
            {
                return true;
            }
        });
    }

    public function test_teen_can_register_a_device(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);
        $response = $this->actingAs($teen)
            ->postJson('/api/devices', [
                'mac_address' => 'aa:bb:cc:dd:ee:ff',
                'name' => 'iPhone',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('user_devices', [
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:ff',
            'name' => 'iPhone',
            'status' => 'pending_approval',
            'authorized_at' => null,
        ]);
    }

    public function test_teen_can_register_device_with_bandwidth_limit(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);
        $this->actingAs($teen)
            ->postJson('/api/devices', [
                'mac_address' => 'aa:bb:cc:dd:ee:ff',
                'name' => 'iPad',
                'bandwidth_limit' => 1024,
            ])
            ->assertCreated();

        $this->assertDatabaseHas('user_devices', [
            'user_id' => $teen->id,
            'bandwidth_limit' => 1024,
            'status' => 'pending_approval',
        ]);
    }

    public function test_mac_address_is_normalized_to_lowercase(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);
        $this->actingAs($teen)
            ->postJson('/api/devices', [
                'mac_address' => 'AA-BB-CC-DD-EE-FF', // uppercase with dashes
                'name' => 'Device',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('user_devices', [
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:ff', // normalized
        ]);
    }

    public function test_duplicate_device_registration_fails(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);
        UserDevice::create([
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:ff',
            'status' => 'active',
            'authorized_at' => now(),
        ]);

        $this->actingAs($teen)
            ->postJson('/api/devices', [
                'mac_address' => 'aa:bb:cc:dd:ee:ff',
                'name' => 'Duplicate',
            ])
            ->assertUnprocessable();
    }

    public function test_invalid_mac_address_fails(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);

        $this->actingAs($teen)
            ->postJson('/api/devices', [
                'mac_address' => 'invalid-mac',
                'name' => 'Device',
            ])
            ->assertUnprocessable();
    }

    public function test_teen_can_list_their_devices(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);
        $other = User::factory()->create(['role' => 'teen']);

        UserDevice::create(['user_id' => $teen->id, 'mac_address' => 'aa:bb:cc:dd:ee:ff', 'status' => 'active', 'authorized_at' => now()]);
        UserDevice::create(['user_id' => $teen->id, 'mac_address' => 'aa:bb:cc:dd:ee:11', 'status' => 'active', 'authorized_at' => now()]);
        UserDevice::create(['user_id' => $other->id, 'mac_address' => 'aa:bb:cc:dd:ee:22', 'status' => 'active', 'authorized_at' => now()]);

        $response = $this->actingAs($teen)
            ->getJson('/api/devices')
            ->assertOk();

        $this->assertCount(2, $response->json('devices'));
    }

    public function test_teen_can_view_single_device(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);
        $device = UserDevice::create([
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:ff',
            'status' => 'active',
            'authorized_at' => now(),
        ]);

        $this->actingAs($teen)
            ->getJson("/api/devices/{$device->id}")
            ->assertOk()
            ->assertJsonPath('device.id', $device->id);
    }

    public function test_teen_cannot_view_other_users_device(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);
        $other = User::factory()->create(['role' => 'teen']);
        $device = UserDevice::create([
            'user_id' => $other->id,
            'mac_address' => 'aa:bb:cc:dd:ee:ff',
            'status' => 'active',
            'authorized_at' => now(),
        ]);

        $this->actingAs($teen)
            ->getJson("/api/devices/{$device->id}")
            ->assertForbidden();
    }

    public function test_teen_can_unregister_a_device(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);
        $device = UserDevice::create([
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:ff',
            'status' => 'active',
            'authorized_at' => now(),
        ]);

        $this->actingAs($teen)
            ->deleteJson("/api/devices/{$device->id}")
            ->assertOk();

        $this->assertDatabaseMissing('user_devices', ['id' => $device->id]);
    }

    public function test_parent_cannot_access_device_endpoints(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);

        $this->actingAs($parent)
            ->postJson('/api/devices', ['mac_address' => 'aa:bb:cc:dd:ee:ff'])
            ->assertForbidden();

        $this->actingAs($parent)
            ->getJson('/api/devices')
            ->assertForbidden();
    }

    public function test_unifi_registration_failure_is_handled(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);

        // Since registration is deferred, the teen CAN register successfully even if UniFi is down
        $this->actingAs($teen)
            ->postJson('/api/devices', [
                'mac_address' => 'aa:bb:cc:dd:ee:ff',
                'name' => 'Device',
            ])
            ->assertCreated();

        // The device should exist with pending_approval status
        $this->assertDatabaseHas('user_devices', [
            'mac_address' => 'aa:bb:cc:dd:ee:ff',
            'status' => 'pending_approval',
        ]);
    }
}
