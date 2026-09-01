<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $title
 * @property string|null $description
 * @property int $points_value
 * @property int $assigned_to
 * @property int $created_by
 * @property bool $active
 * @property string $recurrence_type
 * @property int|null $recurrence_interval
 * @property string|null $recurrence_unit
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @method static \Illuminate\Database\Eloquent\Builder|Chore where(string $column, $operator = null, $value = null, string $boolean = 'and')
 * @method static \Illuminate\Database\Eloquent\Builder|Chore create(array $attributes = [])
 */
class Chore extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function completions(): HasMany
    {
        return $this->hasMany(ChoreCompletion::class);
    }

    public function claims(): HasMany
    {
        return $this->hasMany(ChoreClaim::class);
    }

    public function isRecurring(): bool
    {
        return $this->recurrence_type !== 'none';
    }
}
