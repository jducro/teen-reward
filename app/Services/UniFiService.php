<?php

namespace App\Services;

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

        if (!$host || !$username || !$password || !$site) {
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
            throw new \Exception('Failed to authenticate with UniFi controller: ' . $e->getMessage());
        }
    }

    public function generateVoucher(int $duration = 60, ?int $bandwidth = null): array
    {
        try {
            $this->ensureConnected();

            $response = $this->client->create_voucher(
                minutes: $duration,
                count: 1,
                quota: 0,
                note: '',
                up: $bandwidth,
                down: $bandwidth,
            );

            if (!is_array($response) || $response === []) {
                throw new \Exception('UniFi API returned empty voucher response');
            }

            $createTime = $response[0]->create_time ?? $response[0]['create_time'] ?? null;

            if (!is_int($createTime)) {
                throw new \Exception('No voucher creation timestamp in UniFi response');
            }

            $voucherResponse = $this->client->stat_voucher($createTime);

            if (!is_array($voucherResponse) || $voucherResponse === []) {
                throw new \Exception('Unable to retrieve created UniFi voucher');
            }

            $voucher = $voucherResponse[0] ?? null;
            $voucherCode = is_object($voucher)
                ? ($voucher->code ?? null)
                : (is_array($voucher) ? ($voucher['code'] ?? null) : null);

            if (!is_string($voucherCode) || $voucherCode === '') {
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
            throw $e;
        }
    }

    /**
     * Revoke a guest voucher.
     *
     * @param string $voucherCode
     * @return bool
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
     * Register a device for direct network access (Tier 3).
     *
     * @param string $deviceMac Device MAC address
     * @param ?int $bandwidth Bandwidth limit in Kbps (optional)
     * @return bool
     *
     * @throws \Exception
     */
    public function registerDevice(string $deviceMac, ?int $bandwidth = null): bool
    {
        try {
            $this->ensureConnected();

            // Normalize MAC address format
            $deviceMac = strtolower(str_replace('-', ':', $deviceMac));

            $this->client->authorize_guest($deviceMac, 0, $bandwidth, $bandwidth);

            Log::info('UniFi device registered successfully', [
                'mac' => $deviceMac,
                'bandwidth' => $bandwidth,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('UniFi device registration failed', [
                'mac' => $deviceMac,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Unregister a device (revoke access).
     *
     * @param string $deviceMac Device MAC address
     * @return bool
     *
     * @throws \Exception
     */
    public function unregisterDevice(string $deviceMac): bool
    {
        try {
            $this->ensureConnected();

            // Normalize MAC address format
            $deviceMac = strtolower(str_replace('-', ':', $deviceMac));

            $this->client->unauthorize_guest($deviceMac);

            Log::info('UniFi device unregistered successfully', [
                'mac' => $deviceMac,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('UniFi device unregistration failed', [
                'mac' => $deviceMac,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get UniFi controller health status (for testing connection).
     *
     * @return bool
     */
    public function isHealthy(): bool
    {
        $this->ensureConnected();

        $this->client->stat_client('00:00:00:00:00:00');

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
