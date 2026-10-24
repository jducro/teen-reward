<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string $mac_address
 * @property string $status
 * @property User|null $user
 */
class UserDevice extends Model
{
    protected $guarded = [];

    protected $casts = [
        'authorized_at' => 'datetime',
        'parent_action_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parentAction(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parent_action_by');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(DeviceApproval::class);
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(RewardRedemption::class, 'user_device_id');
    }

    /** @return HasMany<DeviceAccessGrant, $this> */
    public function accessGrants(): HasMany
    {
        return $this->hasMany(DeviceAccessGrant::class, 'device_id');
    }

    /**
     * Normalize MAC address to lowercase colon-separated format.
     */
    public function setMacAddressAttribute(string $value): void
    {
        $this->attributes['mac_address'] = strtolower(str_replace('-', ':', $value));
    }

    /**
     * Check if device is currently active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if device is pending approval.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending_approval';
    }
}
