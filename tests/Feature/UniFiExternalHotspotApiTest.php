<?php

namespace Tests\Feature;

use App\Services\UniFiService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class UniFiExternalHotspotApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.unifi.host' => 'https://controller.example:8443',
            'services.unifi.api_key' => 'integration-key',
            'services.unifi.api_site_id' => 'site-123',
            'services.unifi.api_base_url' => null,
        ]);
    }

    public function test_connected_client_is_looked_up_by_mac_with_the_official_integration_api(): void
    {
        Http::fake([
            'https://controller.example:8443/proxy/network/integration/v1/sites/site-123/clients*' => Http::response([
                'id' => 'client-456',
                'macAddress' => 'AA:BB:CC:DD:EE:FF',
                'ssid' => 'Family Guest',
                'accessPointMac' => '11:22:33:44:55:66',
            ]),
        ]);

        $client = app(UniFiService::class)->getConnectedClient('aa:bb:cc:dd:ee:ff');

        $this->assertSame([
            'id' => 'client-456',
            'mac' => 'aa:bb:cc:dd:ee:ff',
            'ssid' => 'Family Guest',
            'ap_mac' => '11:22:33:44:55:66',
        ], $client);
        Http::assertSent(fn ($request): bool => $request->method() === 'GET'
            && str_contains($request->url(), '/sites/site-123/clients')
            && str_contains($request->url(), 'filter=')
            && $request->hasHeader('X-API-Key', 'integration-key'));
    }

    public function test_timed_authorization_uses_the_client_id_and_official_action_body(): void
    {
        Http::fake([
            'https://controller.example:8443/proxy/network/integration/v1/sites/site-123/clients*' => Http::response([
                'data' => [[
                    'id' => 'client-456',
                    'macAddress' => 'aa:bb:cc:dd:ee:ff',
                    'ssid' => 'Family Guest',
                ]],
            ]),
            'https://controller.example:8443/proxy/network/integration/v1/sites/site-123/clients/client-456/actions' => Http::response([], 200),
        ]);

        $this->assertTrue(app(UniFiService::class)->authorizeDeviceForDuration('aa:bb:cc:dd:ee:ff', 42, 512));

        Http::assertSent(fn ($request): bool => $request->method() === 'POST'
            && str_ends_with($request->url(), '/sites/site-123/clients/client-456/actions')
            && $request['action'] === 'AUTHORIZE_GUEST_ACCESS'
            && $request['timeLimitMinutes'] === 42
            && $request['rxRateLimitKbps'] === 512
            && $request['txRateLimitKbps'] === 512
            && $request->hasHeader('X-API-Key', 'integration-key'));
    }

    public function test_timed_authorization_rejects_macs_that_are_not_currently_connected(): void
    {
        Http::fake([
            '*' => Http::response(['data' => []]),
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('UniFi did not return a connected client ID');

        app(UniFiService::class)->authorizeDeviceForDuration('aa:bb:cc:dd:ee:ff', 30);
    }
}
