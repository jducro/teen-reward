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
            $table->foreignId('user_device_id')->nullable()->constrained('user_devices')->nullOnDelete();
            $table->timestamp('access_expires_at')->nullable();
            $table->uuid('portal_request_key')->nullable()->unique();
            $table->index(['user_device_id', 'access_expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reward_redemptions', function (Blueprint $table) {
            $table->dropUnique(['portal_request_key']);
            $table->dropIndex(['user_device_id', 'access_expires_at']);
            $table->dropConstrainedForeignId('user_device_id');
            $table->dropColumn(['access_expires_at', 'portal_request_key']);
        });
    }
};
