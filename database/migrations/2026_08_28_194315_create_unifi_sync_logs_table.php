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
        Schema::create('unifi_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('redemption_id')->constrained('reward_redemptions')->cascadeOnDelete();
            $table->enum('status', ['success', 'failure']);
            $table->json('api_response')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unifi_sync_logs');
    }
};
