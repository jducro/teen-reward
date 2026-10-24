<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeviceAccessGrant extends Model
{
    protected $guarded = [];

    protected $casts = [
        'authorized_at' => 'datetime',
        'access_expires_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(UserDevice::class);
    }

    public function redemption(): BelongsTo
    {
        return $this->belongsTo(RewardRedemption::class, 'reward_redemption_id');
    }
}
