<?php

namespace App\Services;

use App\Models\DeviceAccessGrant;
use App\Models\RewardRedemption;
use App\Models\UniFiSyncLog;
use App\Models\User;
use App\Models\UserDevice;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WifiAccessService
{
    public function __construct(private readonly UniFiService $unifiService) {}

    public function activeRedemptionFor(User $user): ?RewardRedemption
    {
        return RewardRedemption::query()
            ->where('user_id', $user->id)
            ->where('status', 'fulfilled')
            ->where('unifi_sync_status', 'synced')
            ->where('access_expires_at', '>', now())
            ->whereHas('reward', fn ($query) => $query->where('type', 'wifi'))
            ->orderByDesc('access_expires_at')
            ->first();
    }

    /**
     * Authorize one approved device for the remaining duration of a teen's Wi-Fi redemption.
     *
     * The authorization row is a persistent snapshot so it remains auditable after a device is removed.
     */
    public function authorizeDeviceForRedemption(UserDevice $device, RewardRedemption $redemption, string $source): bool
    {
        return DB::transaction(function () use ($device, $redemption, $source): bool {
            $user = User::query()->lockForUpdate()->findOrFail($redemption->user_id);
            $lockedDevice = UserDevice::query()->lockForUpdate()->findOrFail($device->id);
            $lockedRedemption = RewardRedemption::query()->lockForUpdate()->findOrFail($redemption->id);

            if ($lockedDevice->user_id !== $user->id || ! $lockedDevice->isActive() || $lockedRedemption->user_id !== $user->id) {
                return false;
            }

            $expiresAt = $lockedRedemption->access_expires_at;
            if ($expiresAt->isPast()) {
                return false;
            }

            $grant = DeviceAccessGrant::query()
                ->where('reward_redemption_id', $lockedRedemption->id)
                ->where('mac_address', $lockedDevice->mac_address)
                ->lockForUpdate()
                ->first();

            if ($grant?->status === 'synced' && $grant->access_expires_at->equalTo($expiresAt)) {
                return true;
            }

            $grant ??= new DeviceAccessGrant;
            $grant->fill([
                'user_id' => $user->id,
                'reward_redemption_id' => $lockedRedemption->id,
                'device_id' => $lockedDevice->id,
                'mac_address' => $lockedDevice->mac_address,
                'device_name' => $lockedDevice->name,
                'reward_name' => $lockedRedemption->reward?->name,
                'source' => $source,
                'status' => 'pending',
                'access_expires_at' => $expiresAt,
                'revoked_at' => null,
                'error_message' => null,
            ]);
            $grant->save();

            $minutes = max(1, (int) ceil(now()->diffInSeconds($expiresAt, false) / 60));
            try {
                $this->unifiService->authorizeDeviceForDuration(
                    $lockedDevice->mac_address,
                    $minutes,
                    $lockedDevice->bandwidth_limit
                );

                $grant->update([
                    'status' => 'synced',
                    'authorized_at' => now(),
                    'error_message' => null,
                ]);

                UniFiSyncLog::query()->create([
                    'redemption_id' => $lockedRedemption->id,
                    'status' => 'success',
                    'api_response' => [
                        'device_mac' => $lockedDevice->mac_address,
                        'duration_minutes' => $minutes,
                        'source' => $source,
                    ],
                ]);

                return true;
            } catch (\Throwable $exception) {
                $errorMessage = Str::limit($exception->getMessage(), 2000);
                $grant->update([
                    'status' => 'failed',
                    'error_message' => $errorMessage,
                ]);

                UniFiSyncLog::query()->create([
                    'redemption_id' => $lockedRedemption->id,
                    'status' => 'failure',
                    'error_message' => $errorMessage,
                ]);

                return false;
            }
        });
    }
}
