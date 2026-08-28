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
        Schema::table('user_devices', function (Blueprint $table) {
            // Change status enum to include pending_approval, rejected, inactive
            $table->enum('status', ['pending_approval', 'active', 'rejected', 'inactive'])
                ->change()->default('pending_approval');

            // Track parent approval actions
            $table->foreignId('parent_action_by')->nullable()->constrained('users')->cascadeOnDelete();
            $table->timestamp('parent_action_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_devices', function (Blueprint $table) {
            $table->dropForeign(['parent_action_by']);
            $table->dropColumn(['parent_action_by', 'parent_action_at']);
            $table->enum('status', ['active', 'inactive'])->change()->default('active');
        });
    }
};
