<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UniFiSyncLog extends Model
{
    protected $guarded = [];

    public $timestamps = false;

    protected $casts = [
        'api_response' => 'json',
        'created_at' => 'datetime',
    ];

    public function redemption(): BelongsTo
    {
        return $this->belongsTo(RewardRedemption::class, 'redemption_id');
    }
}
