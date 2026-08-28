<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDevice extends Model
{
    protected $guarded = [];

    protected $casts = [
        'authorized_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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
}
