<?php

namespace Tests\Support;

use App\Services\UniFiService;

class FakePortalUniFiService extends UniFiService
{
    /** @var array<int, array{0: string, 1: int, 2: int|null}> */
    public array $authorizations = [];

    public bool $failAuthorization = false;

    public bool $clientAvailable = true;

    /**
     * @return array{id: string|null, mac: string, ssid: string|null, ap_mac: string|null}|null
     */
    public function getConnectedClient(string $deviceMac): ?array
    {
        if (! $this->clientAvailable) {
            return null;
        }

        return ['id' => null, 'mac' => $deviceMac, 'ssid' => 'Family Guest', 'ap_mac' => '11:22:33:44:55:66'];
    }

    public function authorizeDeviceForDuration(string $deviceMac, int $minutes, ?int $bandwidth = null): bool
    {
        $this->authorizations[] = [$deviceMac, $minutes, $bandwidth];
        if ($this->failAuthorization) {
            throw new \RuntimeException('controller unavailable');
        }

        return true;
    }
}
