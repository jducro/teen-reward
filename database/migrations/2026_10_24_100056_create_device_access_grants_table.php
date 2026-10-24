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
        Schema::create('device_access_grants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reward_redemption_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('device_id')->nullable()->constrained('user_devices')->nullOnDelete();
            $table->string('mac_address', 17);
            $table->string('device_name')->nullable();
            $table->string('reward_name')->nullable();
            $table->string('source');
            $table->string('status')->default('pending');
            $table->timestamp('authorized_at')->nullable();
            $table->timestamp('access_expires_at');
            $table->timestamp('revoked_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->unique(['reward_redemption_id', 'mac_address']);
            $table->index(['user_id', 'status', 'access_expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('device_access_grants');
    }
};
