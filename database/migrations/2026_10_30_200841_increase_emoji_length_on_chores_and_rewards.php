<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chores', function (Blueprint $table) {
            $table->string('emoji', 255)->default('🧹')->change();
        });

        Schema::table('rewards', function (Blueprint $table) {
            $table->string('emoji', 255)->default('🎁')->change();
        });
    }

    public function down(): void
    {
        Schema::table('chores', function (Blueprint $table) {
            $table->string('emoji', 16)->default('🧹')->change();
        });

        Schema::table('rewards', function (Blueprint $table) {
            $table->string('emoji', 16)->default('🎁')->change();
        });
    }
};
