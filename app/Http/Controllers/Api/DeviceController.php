<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceApproval;
use App\Models\UserDevice;
use App\Services\UniFiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function __construct(private UniFiService $unifiService) {}

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

        // Check if device already registered for this user
        if (UserDevice::where('user_id', $user->id)
            ->where('mac_address', $this->normalizeMac($data['mac_address']))
            ->whereIn('status', ['active', 'pending_approval'])
            ->exists()) {
            return response()->json([
                'message' => 'Device already registered',
            ], 422);
        }

        try {
            // Create device record with pending_approval status (UniFi registration deferred)
            $device = UserDevice::create([
                'user_id' => $user->id,
                'mac_address' => $this->normalizeMac($data['mac_address']),
                'name' => $data['name'],
                'bandwidth_limit' => $data['bandwidth_limit'] ?? null,
                'status' => 'pending_approval',
                'authorized_at' => null,
            ]);

            return response()->json([
                'message' => 'Device registration submitted for approval',
                'device' => $device,
            ], 201);
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
            ->orderBy('created_at', 'desc')
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
            ->orderBy('created_at', 'desc')
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
            // Register device in UniFi
            $this->unifiService->registerDevice(
                deviceMac: $device->mac_address,
                bandwidth: $device->bandwidth_limit ?? null
            );

            // Update device status
            $device->update([
                'status' => 'active',
                'authorized_at' => now(),
                'parent_action_by' => $user->id,
                'parent_action_at' => now(),
            ]);

            // Log approval
            DeviceApproval::create([
                'device_id' => $device->id,
                'parent_id' => $user->id,
                'action' => 'approved',
            ]);

            return response()->json([
                'message' => 'Device approved and activated',
                'device' => $device,
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
