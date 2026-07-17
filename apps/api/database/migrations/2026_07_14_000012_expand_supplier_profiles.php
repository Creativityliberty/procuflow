<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('bank_name')->nullable()->after('country');
            $table->string('iban')->nullable()->after('bank_name');
            $table->string('swift', 40)->nullable()->after('iban');
            $table->json('products')->nullable()->after('swift');
            $table->json('services')->nullable()->after('products');
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn(['bank_name', 'iban', 'swift', 'products', 'services']);
        });
    }
};
