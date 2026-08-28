<?php

namespace Database\Factories;

use App\Models\Reward;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reward>
 */
class RewardFactory extends Factory
{
    protected $model = Reward::class;

    public function definition(): array
    {
        return [
            'name' => fake()->word(),
            'type' => 'wifi',
            'points_cost' => 15,
            'duration_minutes' => 60,
            'emoji' => '🎁',
        ];
    }

    public function physical(): self
    {
        return $this->state(function () {
            return [
                'type' => 'physical',
                'duration_minutes' => null,
            ];
        });
    }
}
