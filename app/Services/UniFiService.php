<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use UniFi_API\Client;

class UniFiService
{
    private ?Client $client = null;

    private bool $initialized = false;

    /**
     * Initialize and authenticate with UniFi controller (lazy-loaded).
     *
     * @throws \Exception
     */
    private function ensureConnected(): void
    {
        if ($this->initialized) {
            return;
        }

        $this->initializeClient();
        $this->initialized = true;
    }

    /**
     * Initialize and authenticate with UniFi controller.
     *
     * @throws \Exception
     */
    private function initializeClient(): void
    {
        $host = config('services.unifi.host');
        $username = config('services.unifi.username');
        $password = config('services.unifi.password');
        $site = config('services.unifi.site');
        $allowSelfSigned = (bool) config('services.unifi.allow_self_signed', false);

        if (! $host || ! $username || ! $password || ! $site) {
            throw new \Exception('UniFi configuration is incomplete. Check UNIFI_HOST, UNIFI_USERNAME, UNIFI_PASSWORD, UNIFI_SITE environment variables.');
        }

        $this->client = new Client(
            user: $username,
            password: $password,
            baseurl: $host,
            site: $site,
            version: null,
            ssl_verify: ! $allowSelfSigned,
            unificookie_name: 'unificookie'
        );

        try {
            $this->client->login();
        } catch (\Exception $e) {
            Log::error('UniFi login failed', [
                'host' => $host,
                'error' => $e->getMessage(),
            ]);
            throw new \Exception('Failed to authenticate with UniFi controller: '.$e->getMessage());
        }
    }

    public function generateVoucher(int $duration = 60, ?int $bandwidth = null, ?string $note = null): array
    {
        try {
            if (config('app.debug')) {
                Log::debug('UniFi voucher generation started', [
                    'duration_minutes' => $duration,
                    'bandwidth' => $bandwidth,
                    'host' => config('services.unifi.host'),
                    'site' => config('services.unifi.site'),
                ]);
            }

            $this->ensureConnected();

            $response = $this->client->create_voucher(
                minutes: $duration,
                count: 1,
                quota: 0,
                note: $note ?? '',
                up: $bandwidth,
                down: $bandwidth,
            );

            if (! is_array($response) || $response === []) {
                throw new \Exception('UniFi API returned empty voucher response');
            }

            if (config('app.debug')) {
                Log::debug('UniFi voucher create response received', [
                    'response' => $response,
                ]);
            }

            $createTime = $response[0]->create_time ?? $response[0]['create_time'] ?? null;

            if (! is_int($createTime)) {
                throw new \Exception('No voucher creation timestamp in UniFi response');
            }

            $voucherResponse = $this->client->stat_voucher($createTime);

            if (! is_array($voucherResponse) || $voucherResponse === []) {
                throw new \Exception('Unable to retrieve created UniFi voucher');
            }

            if (config('app.debug')) {
                Log::debug('UniFi voucher details response received', [
                    'create_time' => $createTime,
                    'response' => $voucherResponse,
                ]);
            }

            $voucher = $voucherResponse[0] ?? null;
            $voucherCode = is_object($voucher)
                ? ($voucher->code ?? null)
                : (is_array($voucher) ? ($voucher['code'] ?? null) : null);

            if (! is_string($voucherCode) || $voucherCode === '') {
                throw new \Exception('No voucher code in UniFi voucher details');
            }

            $expiresAt = now()->addMinutes($duration);

            Log::info('UniFi voucher generated successfully', [
                'code' => $voucherCode,
                'duration_minutes' => $duration,
                'expires_at' => $expiresAt,
            ]);

            return [
                'code' => $voucherCode,
                'expires_at' => $expiresAt,
            ];
        } catch (\Exception $e) {
            Log::error('UniFi voucher generation failed', [
                'error' => $e->getMessage(),
                'duration' => $duration,
                'bandwidth' => $bandwidth,
            ]);

            if (config('app.debug')) {
                Log::debug('UniFi voucher generation exception context', [
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                    'trace' => collect(explode("\n", $e->getTraceAsString()))->take(12)->all(),
                ]);
            }

            throw $e;
        }
    }

    /**
     * Revoke a guest voucher.
     *
     *
     * @throws \Exception
     */
    public function revokeVoucher(string $voucherCode): bool
    {
        try {
            $this->ensureConnected();

            $this->client->revoke_voucher($voucherCode);

            Log::info('UniFi voucher revoked successfully', [
                'code' => $voucherCode,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('UniFi voucher revocation failed', [
                'code' => $voucherCode,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Confirm that a MAC address is currently connected to the configured UniFi site.
     *
     * @return array{id: string|null, mac: string, ssid: string|null, ap_mac: string|null}|null
     *
     * @throws \Exception
     */
    public function getConnectedClient(string $deviceMac): ?array
    {
        $normalizedMac = strtolower(str_replace('-', ':', $deviceMac));
        $response = $this->integrationApiRequest()->get(
            $this->integrationApiUrl('/sites/'.rawurlencode($this->integrationSiteId()).'/clients'),
            ['filter' => "macAddress.eq('".strtoupper($normalizedMac)."')"]
        );
        if (! $response->successful()) {
            Log::warning('UniFi connected client API returned an unsuccessful response', [
                'site_id' => $this->integrationSiteId(),
                'http_status' => $response->status(),
            ]);
            $response->throw();
        }

        $payload = $response->json();
        if (! is_array($payload)) {
            $this->logConnectedClientLookupMiss($normalizedMac, $response->status(), $payload, []);

            return $this->findConnectedClientInUnfilteredPages($normalizedMac);
        }

        $clientRecords = $this->clientRecordsFromPayload($payload);
        foreach ($clientRecords as $client) {
            if ($this->clientMatchesMac($client, $normalizedMac)) {
                return $this->normalizeConnectedClient($client, $normalizedMac);
            }
        }

        $this->logConnectedClientLookupMiss($normalizedMac, $response->status(), $payload, $clientRecords);

        return $this->findConnectedClientInUnfilteredPages($normalizedMac);
    }

    /**
     * @param  array<string|int, mixed>  $payload
     * @return array<int, array<string|int, mixed>>
     */
    private function clientRecordsFromPayload(array $payload): array
    {
        if (isset($payload['macAddress']) || isset($payload['mac'])) {
            return [$payload];
        }

        $clients = $payload['data'] ?? $payload;
        if (! is_array($clients)) {
            return [];
        }
        if (isset($clients['macAddress']) || isset($clients['mac'])) {
            return [$clients];
        }

        return array_values(array_filter($clients, 'is_array'));
    }

    private function clientMatchesMac(array $client, string $normalizedMac): bool
    {
        $clientMac = $client['macAddress'] ?? $client['mac'] ?? null;

        return is_string($clientMac) && strtolower(str_replace('-', ':', $clientMac)) === $normalizedMac;
    }

    /** @return array{id: string|null, mac: string, ssid: string|null, ap_mac: string|null} */
    private function normalizeConnectedClient(array $client, string $normalizedMac): array
    {
        return [
            'id' => is_string($client['id'] ?? null) ? $client['id'] : null,
            'mac' => $normalizedMac,
            'ssid' => is_string($client['ssid'] ?? $client['essid'] ?? null) ? ($client['ssid'] ?? $client['essid']) : null,
            'ap_mac' => isset($client['accessPointMac']) && is_string($client['accessPointMac'])
                ? strtolower(str_replace('-', ':', $client['accessPointMac']))
                : (isset($client['ap_mac']) && is_string($client['ap_mac']) ? strtolower(str_replace('-', ':', $client['ap_mac'])) : null),
        ];
    }

    /**
     * The Integration API filter can return an empty page even when the client is listed.
     * Fall back to paginating the site client list and still require an exact MAC match.
     *
     * @return array{id: string|null, mac: string, ssid: string|null, ap_mac: string|null}|null
     */
    private function findConnectedClientInUnfilteredPages(string $normalizedMac): ?array
    {
        $limit = 100;
        $offset = 0;
        $pageCount = 0;
        $totalCount = null;
        $baseUrl = $this->integrationApiUrl('/sites/'.rawurlencode($this->integrationSiteId()).'/clients');

        do {
            $response = $this->integrationApiRequest()->get($baseUrl, [
                'offset' => $offset,
                'limit' => $limit,
            ]);
            if (! $response->successful()) {
                Log::warning('UniFi unfiltered client list returned an unsuccessful response', [
                    'site_id' => $this->integrationSiteId(),
                    'http_status' => $response->status(),
                    'offset' => $offset,
                ]);
                $response->throw();
            }

            $payload = $response->json();
            if (! is_array($payload)) {
                break;
            }

            $clients = $this->clientRecordsFromPayload($payload);
            $pageCount++;
            $totalCount = is_numeric($payload['totalCount'] ?? null) ? (int) $payload['totalCount'] : null;

            foreach ($clients as $client) {
                if ($this->clientMatchesMac($client, $normalizedMac)) {
                    Log::notice('UniFi connected client was found in the unfiltered client list', [
                        'requested_mac' => $normalizedMac,
                        'site_id' => $this->integrationSiteId(),
                        'page_offset' => $offset,
                        'pages_scanned' => $pageCount,
                        'total_count' => $totalCount,
                    ]);

                    return $this->normalizeConnectedClient($client, $normalizedMac);
                }
            }

            $returnedCount = is_numeric($payload['count'] ?? null) ? (int) $payload['count'] : count($clients);
            if ($returnedCount < 1) {
                break;
            }
            $offset += $returnedCount;
        } while ($totalCount !== null && $offset < $totalCount && $pageCount < 100);

        Log::debug('UniFi connected client was not present in the unfiltered client list', [
            'requested_mac' => $normalizedMac,
            'site_id' => $this->integrationSiteId(),
            'pages_scanned' => $pageCount,
            'total_count' => $totalCount,
        ]);

        return null;
    }

    /**
     * Log response metadata for diagnosing clients that the Integration API does not return.
     * Client records and API credentials are deliberately omitted from the log context.
     *
     * @param  array<int, array<string|int, mixed>>  $clientRecords
     */
    private function logConnectedClientLookupMiss(string $normalizedMac, int $httpStatus, mixed $payload, array $clientRecords): void
    {
        $firstRecord = $clientRecords[0] ?? [];
        $recordsWithMac = count(array_filter($clientRecords, fn (array $client): bool => is_string($client['macAddress'] ?? $client['mac'] ?? null)));

        Log::notice('UniFi connected client lookup did not match the requested MAC', [
            'requested_mac' => $normalizedMac,
            'site_id' => $this->integrationSiteId(),
            'http_status' => $httpStatus,
            'payload_type' => get_debug_type($payload),
            'top_level_keys' => is_array($payload) ? array_slice(array_map('strval', array_keys($payload)), 0, 20) : [],
            'api_count' => is_array($payload) && is_int($payload['count'] ?? null) ? $payload['count'] : null,
            'api_total_count' => is_array($payload) && is_int($payload['totalCount'] ?? null) ? $payload['totalCount'] : null,
            'api_offset' => is_array($payload) && is_int($payload['offset'] ?? null) ? $payload['offset'] : null,
            'api_limit' => is_array($payload) && is_int($payload['limit'] ?? null) ? $payload['limit'] : null,
            'client_count' => count($clientRecords),
            'clients_with_mac' => $recordsWithMac,
            'first_client_keys' => array_slice(array_map('strval', array_keys($firstRecord)), 0, 30),
        ]);
    }

    /**
     * Authorize a client for a finite number of minutes.
     *
     * @throws \Exception
     */
    public function authorizeDeviceForDuration(string $deviceMac, int $minutes, ?int $bandwidth = null): bool
    {
        if ($minutes < 1) {
            throw new \InvalidArgumentException('Device authorization duration must be at least one minute.');
        }

        $normalizedMac = strtolower(str_replace('-', ':', $deviceMac));
        $client = $this->getConnectedClient($normalizedMac);
        if ($client === null || ! is_string($client['id']) || $client['id'] === '') {
            throw new \RuntimeException('UniFi did not return a connected client ID for the device.');
        }

        $payload = [
            'action' => 'AUTHORIZE_GUEST_ACCESS',
            'timeLimitMinutes' => $minutes,
        ];
        if ($bandwidth !== null) {
            $payload['rxRateLimitKbps'] = $bandwidth;
            $payload['txRateLimitKbps'] = $bandwidth;
        }

        $this->integrationApiRequest()
            ->post($this->integrationApiUrl(
                '/sites/'.rawurlencode($this->integrationSiteId()).'/clients/'.rawurlencode($client['id']).'/actions'
            ), $payload)
            ->throw();

        Log::info('UniFi timed device authorization succeeded', [
            'mac' => $normalizedMac,
            'duration_minutes' => $minutes,
        ]);

        return true;
    }

    private function integrationApiRequest(): PendingRequest
    {
        $apiKey = config('services.unifi.api_key');
        if (! is_string($apiKey) || $apiKey === '') {
            throw new \RuntimeException('UNIFI_API_KEY is required for External Hotspot authorization.');
        }

        return Http::acceptJson()
            ->withHeader('X-API-Key', $apiKey)
            ->timeout(10)
            ->withOptions(['verify' => ! (bool) config('services.unifi.allow_self_signed', false)]);
    }

    private function integrationApiUrl(string $path): string
    {
        $baseUrl = config('services.unifi.api_base_url');
        if (! is_string($baseUrl) || $baseUrl === '') {
            $host = config('services.unifi.host');
            if (! is_string($host) || $host === '') {
                throw new \RuntimeException('UNIFI_HOST or UNIFI_API_BASE_URL is required for External Hotspot authorization.');
            }

            $baseUrl = rtrim($host, '/').'/proxy/network/integration/v1';
        }

        return rtrim($baseUrl, '/').$path;
    }

    private function integrationSiteId(): string
    {
        $siteId = config('services.unifi.api_site_id');
        if (! is_string($siteId) || $siteId === '') {
            throw new \RuntimeException('UNIFI_API_SITE_ID is required for External Hotspot authorization.');
        }

        return $siteId;
    }

    /**
     * Get UniFi controller health status (for testing connection).
     */
    public function isHealthy(): bool
    {
        $this->ensureConnected();

        return true;
    }

    /**
     * Logout from UniFi controller.
     */
    public function __destruct()
    {
        if ($this->client) {
            try {
                $this->client->logout();
            } catch (\Exception $e) {
                Log::debug('UniFi logout warning', [
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
