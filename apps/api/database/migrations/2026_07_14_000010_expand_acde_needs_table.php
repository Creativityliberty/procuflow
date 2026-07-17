<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('acde_needs', function (Blueprint $table) {
            $table->string('service', 120)->nullable()->after('context');
            $table->date('needed_at')->nullable()->after('service');
        });
    }

    public function down(): void
    {
        Schema::table('acde_needs', function (Blueprint $table) {
            $table->dropColumn(['service', 'needed_at']);
        });
    }
};
