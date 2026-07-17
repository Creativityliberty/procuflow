<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('legal_name')->nullable();
            $table->string('slug')->unique();
            $table->string('rccm')->nullable();
            $table->string('niu')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('address')->nullable();
            $table->string('company_size', 30)->nullable();
            $table->string('currency', 8)->default('XAF');
            $table->unsignedBigInteger('rfq_threshold')->default(500000);
            $table->unsignedSmallInteger('default_payment_days')->default(30);
            $table->boolean('cost_center_required')->default(true);
            $table->timestamp('onboarding_completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
