<?php

namespace Database\Seeders;

use App\Models\Chore;
use App\Models\User;
use Illuminate\Database\Seeder;

class ChoreSeeder extends Seeder
{
    public function run(): void
    {
        $parent = User::where('role', 'parent')->first();

        Chore::create([
            'title' => 'Clean your room',
            'description' => 'Make your room tidy and vacuumed.',
            'points_value' => 15,
            'recurrence_type' => 'weekly',
            'created_by' => $parent->id,
        ]);
    }
}
