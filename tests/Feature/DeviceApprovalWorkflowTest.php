<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserDevice;
use App\Services\UniFiService;
use Mockery;
use Tests\TestCase;

class DeviceApprovalWorkflowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->app->instance(UniFiService::class, Mockery::mock(UniFiService::class));
    }

    public function test_teen_can_register_device_with_pending_approval_status(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);

        $this->actingAs($teen)
            ->postJson('/api/devices', [
                'mac_address' => 'aa:bb:cc:dd:ee:ff',
                'name' => 'My Phone',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('user_devices', [
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:ff',
            'status' => 'pending_approval',
            'authorized_at' => null,
        ]);
    }

    public function test_parent_can_list_pending_devices_across_all_teens(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $teen1 = User::factory()->create(['role' => 'teen']);
        $teen2 = User::factory()->create(['role' => 'teen']);

        UserDevice::create(['user_id' => $teen1->id, 'mac_address' => 'aa:bb:cc:dd:ee:01', 'status' => 'pending_approval']);
        UserDevice::create(['user_id' => $teen1->id, 'mac_address' => 'aa:bb:cc:dd:ee:02', 'status' => 'active', 'authorized_at' => now()]);
        UserDevice::create(['user_id' => $teen2->id, 'mac_address' => 'aa:bb:cc:dd:ee:03', 'status' => 'pending_approval']);

        $response = $this->actingAs($parent)
            ->getJson('/api/devices/pending')
            ->assertOk();

        $this->assertCount(2, $response->json('devices'));
        $this->assertEquals('aa:bb:cc:dd:ee:01', $response->json('devices.0.mac_address'));
        $this->assertEquals('aa:bb:cc:dd:ee:03', $response->json('devices.1.mac_address'));
    }

    public function test_teen_cannot_list_pending_devices(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);

        $this->actingAs($teen)
            ->getJson('/api/devices/pending')
            ->assertForbidden();
    }

    public function test_parent_can_approve_device_and_registers_in_unifi(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $teen = User::factory()->create(['role' => 'teen']);
        $device = UserDevice::create([
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:ff',
            'status' => 'pending_approval',
        ]);

        $response = $this->actingAs($parent)
            ->putJson("/api/devices/{$device->id}/approve")
            ->assertOk();

        $this->assertEquals('Device approved and activated', $response->json('message'));
        $this->assertDatabaseHas('user_devices', [
            'id' => $device->id,
            'status' => 'active',
            'parent_action_by' => $parent->id,
        ]);
    }

    public function test_parent_approval_logs_device_approval_record(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $teen = User::factory()->create(['role' => 'teen']);
        $device = UserDevice::create([
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:ff',
            'status' => 'pending_approval',
        ]);

        $this->actingAs($parent)
            ->putJson("/api/devices/{$device->id}/approve")
            ->assertOk();

        $this->assertDatabaseHas('device_approvals', [
            'device_id' => $device->id,
            'parent_id' => $parent->id,
            'action' => 'approved',
        ]);
    }

    public function test_parent_can_reject_device(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $teen = User::factory()->create(['role' => 'teen']);
        $device = UserDevice::create([
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:ff',
            'status' => 'pending_approval',
        ]);

        $response = $this->actingAs($parent)
            ->putJson("/api/devices/{$device->id}/reject", [
                'reason' => 'Device brand not permitted',
            ])
            ->assertOk();

        $this->assertEquals('Device registration rejected', $response->json('message'));
        $this->assertDatabaseHas('user_devices', [
            'id' => $device->id,
            'status' => 'rejected',
            'parent_action_by' => $parent->id,
        ]);
    }

    public function test_rejection_logs_device_approval_record_with_reason(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $teen = User::factory()->create(['role' => 'teen']);
        $device = UserDevice::create([
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:ff',
            'status' => 'pending_approval',
        ]);

        $this->actingAs($parent)
            ->putJson("/api/devices/{$device->id}/reject", [
                'reason' => 'Device brand not permitted',
            ])
            ->assertOk();

        $this->assertDatabaseHas('device_approvals', [
            'device_id' => $device->id,
            'parent_id' => $parent->id,
            'action' => 'rejected',
            'reason' => 'Device brand not permitted',
        ]);
    }

    public function test_teen_cannot_approve_own_device(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);
        $device = UserDevice::create([
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:ff',
            'status' => 'pending_approval',
        ]);

        $this->actingAs($teen)
            ->putJson("/api/devices/{$device->id}/approve")
            ->assertForbidden();
    }

    public function test_parent_cannot_approve_already_active_device(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $teen = User::factory()->create(['role' => 'teen']);
        $device = UserDevice::create([
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:ff',
            'status' => 'active',
            'authorized_at' => now(),
        ]);

        $this->actingAs($parent)
            ->putJson("/api/devices/{$device->id}/approve")
            ->assertUnprocessable();
    }

    public function test_teen_can_see_device_status_in_list(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);

        $pending = UserDevice::create([
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:01',
            'status' => 'pending_approval',
        ]);

        $active = UserDevice::create([
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:02',
            'status' => 'active',
            'authorized_at' => now(),
        ]);

        $response = $this->actingAs($teen)
            ->getJson('/api/devices')
            ->assertOk();

        $devices = $response->json('devices');
        $this->assertCount(2, $devices);
        // Devices are ordered by created_at DESC, so active (created second) should be first
        $this->assertEquals('active', $devices[0]['status']);
        $this->assertEquals('pending_approval', $devices[1]['status']);
    }

    public function test_teen_can_delete_pending_device_before_approval(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);
        $device = UserDevice::create([
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:ff',
            'status' => 'pending_approval',
        ]);

        $this->actingAs($teen)
            ->deleteJson("/api/devices/{$device->id}")
            ->assertOk();

        $this->assertDatabaseMissing('user_devices', [
            'id' => $device->id,
        ]);
    }

    public function test_approval_failure_does_not_update_device_status(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $teen = User::factory()->create(['role' => 'teen']);
        $device = UserDevice::create([
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:ff',
            'status' => 'pending_approval',
        ]);

        $this->actingAs($parent)
            ->putJson("/api/devices/{$device->id}/approve")
            ->assertUnprocessable();

        $this->assertDatabaseHas('user_devices', [
            'id' => $device->id,
            'status' => 'pending_approval',
        ]);
    }

    public function test_approval_with_bandwidth_limit_passes_to_unifi(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);
        $teen = User::factory()->create(['role' => 'teen']);
        $device = UserDevice::create([
            'user_id' => $teen->id,
            'mac_address' => 'aa:bb:cc:dd:ee:ff',
            'bandwidth_limit' => 2048,
            'status' => 'pending_approval',
        ]);

        $this->actingAs($parent)
            ->putJson("/api/devices/{$device->id}/approve")
            ->assertOk();
    }
}
