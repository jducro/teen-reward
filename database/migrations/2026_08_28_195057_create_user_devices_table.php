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
        Schema::create('user_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('mac_address')->unique();
            $table->string('name')->nullable(); // device name (e.g., "iPhone", "iPad")
            $table->string('status')->default('active'); // active, inactive, revoked
            $table->datetime('authorized_at')->nullable();
            $table->integer('bandwidth_limit')->nullable(); // in Kbps
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_devices');
    }
};
