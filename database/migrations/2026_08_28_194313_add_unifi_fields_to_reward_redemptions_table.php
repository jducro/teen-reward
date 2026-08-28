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
            $table->datetime('voucher_expires_at')->nullable();
            $table->enum('unifi_sync_status', ['pending', 'synced', 'failed'])->nullable();
            $table->string('device_mac')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reward_redemptions', function (Blueprint $table) {
            $table->dropColumn(['voucher_expires_at', 'unifi_sync_status', 'device_mac']);
        });
    }
};
