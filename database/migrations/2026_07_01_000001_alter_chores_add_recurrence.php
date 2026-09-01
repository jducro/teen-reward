<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chores', function (Blueprint $table) {
            // drop assigned_to foreign key and column if exists
            if (Schema::hasColumn('chores', 'assigned_to')) {
                $table->dropForeign(['assigned_to']);
                $table->dropColumn('assigned_to');
            }

            // recurrence fields
            $table->enum('recurrence_type', ['none', 'daily', 'weekly', 'monthly', 'custom'])->default('none');
            $table->integer('recurrence_interval')->nullable();
            $table->string('recurrence_unit')->nullable();
            $table->boolean('active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('chores', function (Blueprint $table) {
            if (! Schema::hasColumn('chores', 'assigned_to')) {
                $table->foreignId('assigned_to')->constrained('users');
            }

            $table->dropColumn(['recurrence_type', 'recurrence_interval', 'recurrence_unit', 'active']);
        });
    }
};
