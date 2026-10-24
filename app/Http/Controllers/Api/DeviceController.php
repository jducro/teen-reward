<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceAccessGrant;
use App\Models\DeviceApproval;
use App\Models\DeviceEvent;
use App\Models\User;
use App\Models\UserDevice;
use App\Services\UniFiService;
use App\Services\WifiAccessService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeviceController extends Controller
{
    public function __construct(private UniFiService $unifiService, private WifiAccessService $wifiAccessService) {}

    /**
     * Register a new device for a teen.
     */
    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        abort_unless($user?->role === 'teen', 403);

        $data = $request->validate([
            'mac_address' => ['required', 'string', 'regex:/^([0-9A-Fa-f]{2}[:\-]){5}([0-9A-Fa-f]{2})$/'],
            'name' => ['nullable', 'string', 'max:255'],
            'bandwidth_limit' => ['nullable', 'integer', 'min:0'],
        ]);

        // Reserve every registered MAC, including rejected devices, until the teen unregisters it.
        $normalizedMac = $this->normalizeMac($data['mac_address']);

        if (UserDevice::where('mac_address', $normalizedMac)->exists()) {
            return response()->json([
                'message' => 'This MAC address is already registered and cannot be shared between teens.',
            ], 409);
        }

        try {
            // Create device record with pending_approval status (UniFi registration deferred)
            $device = UserDevice::create([
                'user_id' => $user->id,
                'mac_address' => $normalizedMac,
                'name' => $data['name'],
                'bandwidth_limit' => $data['bandwidth_limit'] ?? null,
                'status' => 'pending_approval',
                'authorized_at' => null,
            ]);
            DeviceEvent::create([
                'device_id' => $device->id,
                'user_id' => $user->id,
                'actor_id' => $user->id,
                'mac_address' => $device->mac_address,
                'device_name' => $device->name,
                'action' => 'registered',
            ]);

            return response()->json([
                'message' => 'Device registration submitted for approval',
                'device' => $device,
            ], 201);
        } catch (UniqueConstraintViolationException) {
            return response()->json([
                'message' => 'This MAC address is already registered and cannot be shared between teens.',
            ], 409);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to register device: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * List all devices for authenticated teen.
     */
    public function index(): JsonResponse
    {
        $user = auth()->user();
        abort_unless($user?->role === 'teen', 403);

        $devices = UserDevice::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'devices' => $devices,
        ]);
    }

    /**
     * Get a single device.
     */
    public function show(UserDevice $device): JsonResponse
    {
        $user = auth()->user();
        abort_unless($user?->role === 'teen' && $device->user_id === $user->id, 403);

        return response()->json([
            'device' => $device,
        ]);
    }

    /**
     * Unregister (delete) a device.
     */
    public function destroy(UserDevice $device): JsonResponse
    {
        $user = auth()->user();
        abort_unless($user?->role === 'teen' && $device->user_id === $user->id, 403);

        try {
            // Revoke device access in UniFi (if active)
            if ($device->isActive()) {
                $this->unifiService->unregisterDevice($device->mac_address);
            }

            DeviceAccessGrant::query()
                ->where('device_id', $device->id)
                ->whereIn('status', ['pending', 'synced', 'failed'])
                ->update(['status' => 'revoked', 'revoked_at' => now()]);

            DeviceEvent::create([
                'device_id' => $device->id,
                'user_id' => $device->user_id,
                'actor_id' => $user->id,
                'mac_address' => $device->mac_address,
                'device_name' => $device->name,
                'action' => 'unregistered',
            ]);

            $device->delete();

            return response()->json([
                'message' => 'Device unregistered successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to unregister device: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * List all pending device approvals (parent-only).
     */
    public function pending(): JsonResponse
    {
        $user = auth()->user();
        abort_unless($user?->role === 'parent', 403);

        $devices = UserDevice::where('status', 'pending_approval')
            ->with('user')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'devices' => $devices,
        ]);
    }

    /**
     * Approve a device registration (parent-only).
     */
    public function approve(UserDevice $device): JsonResponse
    {
        $user = auth()->user();
        abort_unless($user?->role === 'parent', 403);
        abort_unless($device->status === 'pending_approval', 422);

        try {
            $teen = DB::transaction(function () use ($device, $user): User {
                $lockedTeen = User::query()->lockForUpdate()->findOrFail($device->user_id);
                $lockedDevice = UserDevice::query()->lockForUpdate()->findOrFail($device->id);
                abort_unless($lockedDevice->status === 'pending_approval', 422);
                $lockedDevice->update([
                    'status' => 'active',
                    'authorized_at' => null,
                    'parent_action_by' => $user->id,
                    'parent_action_at' => now(),
                ]);
                DeviceApproval::create(['device_id' => $lockedDevice->id, 'parent_id' => $user->id, 'action' => 'approved']);
                DeviceEvent::create([
                    'device_id' => $lockedDevice->id,
                    'user_id' => $lockedTeen->id,
                    'actor_id' => $user->id,
                    'mac_address' => $lockedDevice->mac_address,
                    'device_name' => $lockedDevice->name,
                    'action' => 'approved',
                ]);

                return $lockedTeen;
            });

            $activeRedemption = $this->wifiAccessService->activeRedemptionFor($teen);
            $accessGranted = $activeRedemption !== null
                ? $this->wifiAccessService->authorizeDeviceForRedemption($device->fresh(), $activeRedemption, 'device_approval')
                : null;

            return response()->json([
                'message' => 'Device approved. It can receive Wi-Fi access when a reward is redeemed.',
                'device' => $device->fresh(),
                'wifi_access_granted' => $accessGranted,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to approve device: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Reject a device registration (parent-only).
     */
    public function reject(UserDevice $device, Request $request): JsonResponse
    {
        $user = auth()->user();
        abort_unless($user?->role === 'parent', 403);
        abort_unless($device->status === 'pending_approval', 422);

        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            // Update device status
            $device->update([
                'status' => 'rejected',
                'parent_action_by' => $user->id,
                'parent_action_at' => now(),
            ]);

            // Log rejection
            DeviceApproval::create([
                'device_id' => $device->id,
                'parent_id' => $user->id,
                'action' => 'rejected',
                'reason' => $data['reason'] ?? null,
            ]);
            DeviceEvent::create([
                'device_id' => $device->id,
                'user_id' => $device->user_id,
                'actor_id' => $user->id,
                'mac_address' => $device->mac_address,
                'device_name' => $device->name,
                'action' => 'rejected',
            ]);

            return response()->json([
                'message' => 'Device registration rejected',
                'device' => $device,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reject device: '.$e->getMessage(),
            ], 422);
        }
    }

    /**
     * Normalize MAC address to lowercase colon-separated format.
     */
    private function normalizeMac(string $mac): string
    {
        return strtolower(str_replace('-', ':', $mac));
    }
}
