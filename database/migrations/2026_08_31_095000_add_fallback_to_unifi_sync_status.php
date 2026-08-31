<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reward_redemptions', function (Blueprint $table) {
            // Drop the old enum and recreate with 'fallback' added
            $table->dropColumn('unifi_sync_status');
        });

        Schema::table('reward_redemptions', function (Blueprint $table) {
            $table->enum('unifi_sync_status', ['pending', 'synced', 'failed', 'fallback'])->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reward_redemptions', function (Blueprint $table) {
            $table->dropColumn('unifi_sync_status');
        });

        Schema::table('reward_redemptions', function (Blueprint $table) {
            $table->enum('unifi_sync_status', ['pending', 'synced', 'failed'])->nullable();
        });
    }
};
