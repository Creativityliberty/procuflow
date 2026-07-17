<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('reference')->unique();
            $table->string('title');
            $table->string('service', 120);
            $table->string('cost_center', 120)->nullable();
            $table->string('project', 120)->nullable();
            $table->string('priority', 20)->default('normal');
            $table->text('reason');
            $table->date('needed_at')->nullable();
            $table->string('currency', 8)->default('XAF');
            $table->unsignedBigInteger('estimated_amount')->default(0);
            $table->string('status', 30)->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'created_by']);
        });

        Schema::create('purchase_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_request_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->decimal('quantity', 14, 3);
            $table->string('unit', 40);
            $table->unsignedBigInteger('estimated_unit_price')->default(0);
            $table->text('specifications')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_request_items');
        Schema::dropIfExists('purchase_requests');
    }
};
