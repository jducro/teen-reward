<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
            ->exists()) {
            return response()->json([
                'message' => 'Device already registered',
            ], 422);
        }

        try {
            $normalizedMac = $this->normalizeMac($data['mac_address']);

            // Register device in UniFi
            $this->unifiService->registerDevice(
                deviceMac: $normalizedMac,
                bandwidth: $data['bandwidth_limit'] ?? null
            );

            // Create device record (model also normalizes via mutator)
            $device = UserDevice::create([
                'user_id' => $user->id,
                'mac_address' => $normalizedMac,
                'name' => $data['name'],
                'bandwidth_limit' => $data['bandwidth_limit'] ?? null,
                'status' => 'active',
                'authorized_at' => now(),
            ]);

            return response()->json([
                'message' => 'Device registered successfully',
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
            // Revoke device access in UniFi
            $this->unifiService->unregisterDevice($device->mac_address);

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
     * Normalize MAC address to lowercase colon-separated format.
     */
    private function normalizeMac(string $mac): string
    {
        return strtolower(str_replace('-', ':', $mac));
    }
}
