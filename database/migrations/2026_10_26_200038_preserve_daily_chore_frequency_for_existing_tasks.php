<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('chores')
            ->where('recurrence_type', 'none')
            ->update(['recurrence_type' => 'daily']);
    }

    public function down(): void {}
};
