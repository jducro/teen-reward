<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\UniFiService;
use Tests\TestCase;

class UniFiConnectionTest extends TestCase
{
    public function test_parent_can_test_unifi_connection(): void
    {
        $parent = User::factory()->create(['role' => 'parent']);

        $service = new class extends UniFiService
        {
            public function isHealthy(): bool
            {
                return true;
            }
        };

        $this->app->instance(UniFiService::class, $service);

        $this->actingAs($parent)
            ->postJson('/api/unifi/test-connection')
            ->assertOk()
            ->assertJsonPath('message', 'UniFi connection successful.');
    }

    public function test_teen_cannot_test_unifi_connection(): void
    {
        $teen = User::factory()->create(['role' => 'teen']);

        $this->actingAs($teen)
            ->postJson('/api/unifi/test-connection')
            ->assertForbidden();
    }
}
