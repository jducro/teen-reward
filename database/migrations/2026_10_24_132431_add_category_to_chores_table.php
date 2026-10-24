<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('chores', function (Blueprint $table) {
            $table->string('category')->default('fun')->after('points_value');
        });

        DB::table('chores')->where('points_value', '<=', 15)->update(['category' => 'quick']);
        DB::table('chores')->whereBetween('points_value', [16, 30])->update(['category' => 'fun']);
        DB::table('chores')->where('points_value', '>', 30)->update(['category' => 'big']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chores', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};
