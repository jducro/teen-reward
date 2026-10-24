<?php

namespace Tests\Feature;

use App\Services\UniFiService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
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
            && str_contains(urldecode($request->url()), "filter=macAddress.eq('AA:BB:CC:DD:EE:FF')")
            && $request->hasHeader('X-API-Key', 'integration-key'));
    }

    public function test_timed_authorization_uses_the_client_id_and_official_action_body(): void
    {
        Http::fake([
            'https://controller.example:8443/proxy/network/integration/v1/sites/site-123/clients*' => Http::response([
                'data' => [
                    'id' => 'client-456',
                    'macAddress' => 'aa:bb:cc:dd:ee:ff',
                    'ssid' => 'Family Guest',
                ],
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

    public function test_missing_connected_client_logs_response_shape_without_logging_client_data(): void
    {
        Http::fake([
            '*' => Http::response([
                'offset' => 0,
                'limit' => 25,
                'count' => 1,
                'totalCount' => 1,
                'data' => [[
                    'id' => 'client-123',
                    'type' => 'WIRELESS',
                    'name' => 'Private device name',
                ]],
            ]),
        ]);
        Log::spy();

        $this->assertNull(app(UniFiService::class)->getConnectedClient('aa:bb:cc:dd:ee:ff'));

        Log::shouldHaveReceived('notice')
            ->once()
            ->with('UniFi connected client lookup did not match the requested MAC', \Mockery::on(function (array $context): bool {
                $this->assertSame('aa:bb:cc:dd:ee:ff', $context['requested_mac']);
                $this->assertSame('site-123', $context['site_id']);
                $this->assertSame(200, $context['http_status']);
                $this->assertSame(1, $context['api_count']);
                $this->assertSame(1, $context['api_total_count']);
                $this->assertSame(25, $context['api_limit']);
                $this->assertSame(1, $context['client_count']);
                $this->assertSame(0, $context['clients_with_mac']);
                $this->assertSame(['id', 'type', 'name'], $context['first_client_keys']);
                $this->assertArrayNotHasKey('client_data', $context);

                return true;
            }));
    }
}
