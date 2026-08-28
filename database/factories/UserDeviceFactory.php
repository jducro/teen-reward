<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserDevice;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserDevice>
 */
class UserDeviceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'mac_address' => $this->faker->macAddress(),
            'name' => $this->faker->word(),
            'status' => 'active',
            'authorized_at' => now(),
            'bandwidth_limit' => null,
        ];
    }
}
