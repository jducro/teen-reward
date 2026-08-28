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

        if (!$host || !$username || !$password || !$site) {
            throw new \Exception('UniFi configuration is incomplete. Check UNIFI_HOST, UNIFI_USERNAME, UNIFI_PASSWORD, UNIFI_SITE environment variables.');
        }

        $this->client = new Client(
            $host,
            $username,
            $password,
            $site,
            '8443',
            false // SSL verification - set to true in production
        );

        if (config('services.unifi.allow_self_signed')) {
            $this->client->set_request_timeout(5);
        }

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

            $voucher_params = [
                'n_vouchers' => 1,
                'expire' => $duration,
                'up' => $bandwidth,
                'down' => $bandwidth,
            ];

            // Remove bandwidth params if not specified
            if ($bandwidth === null) {
                unset($voucher_params['up'], $voucher_params['down']);
            }

            $response = $this->client->create_voucher($voucher_params);

            if (!$response || empty($response)) {
                throw new \Exception('UniFi API returned empty voucher response');
            }

            // Extract the voucher code from response
            $voucher_code = $response[0] ?? null;
            if (!$voucher_code) {
                throw new \Exception('No voucher code in UniFi response');
            }

            $expires_at = now()->addMinutes($duration);

            Log::info('UniFi voucher generated successfully', [
                'code' => $voucher_code,
                'duration_minutes' => $duration,
                'expires_at' => $expires_at,
            ]);

            return [
                'code' => $voucher_code,
                'expires_at' => $expires_at,
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

            $device_params = [
                'mac' => $deviceMac,
                'up' => $bandwidth,
                'down' => $bandwidth,
            ];

            // Remove bandwidth params if not specified
            if ($bandwidth === null) {
                unset($device_params['up'], $device_params['down']);
            }

            $this->client->authorize_guest($device_params);

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
        try {
            $this->ensureConnected();
            $this->client->stat_client();
            return true;
        } catch (\Exception $e) {
            Log::warning('UniFi health check failed', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
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
