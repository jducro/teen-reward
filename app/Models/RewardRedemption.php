<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property Reward|null $reward
 * @property User|null $user
 */
class RewardRedemption extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'redeemed_at' => 'datetime',
        'voucher_expires_at' => 'datetime',
        'access_expires_at' => 'datetime',
    ];

    public function reward(): BelongsTo
    {
        return $this->belongsTo(Reward::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(UserDevice::class, 'user_device_id');
    }

    public function deviceAccessGrants(): HasMany
    {
        return $this->hasMany(DeviceAccessGrant::class);
    }
}
