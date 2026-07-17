<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purchase_request_id')->constrained()->restrictOnDelete();
            $table->foreignId('rfq_comparison_id')->unique()->constrained()->restrictOnDelete();
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            $table->foreignId('supplier_offer_id')->constrained()->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('reference')->unique();
            $table->string('status', 30)->default('created');
            $table->string('currency', 8)->default('XAF');
            $table->unsignedBigInteger('subtotal')->default(0);
            $table->unsignedBigInteger('discount_amount')->default(0);
            $table->unsignedBigInteger('tax_amount')->default(0);
            $table->unsignedBigInteger('transport_cost')->default(0);
            $table->unsignedBigInteger('insurance_cost')->default(0);
            $table->unsignedBigInteger('total_amount')->default(0);
            $table->text('payment_terms')->nullable();
            $table->string('incoterm', 20)->nullable();
            $table->string('delivery_location')->nullable();
            $table->date('expected_delivery_at')->nullable();
            $table->text('notes')->nullable();
            $table->string('signature_hash', 64)->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->string('supplier_token_hash', 64)->nullable()->unique();
            $table->string('supplier_token_last_four', 4)->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('supplier_responded_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->decimal('quantity', 14, 3);
            $table->string('unit', 40);
            $table->unsignedBigInteger('unit_price');
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->decimal('tax_percent', 5, 2)->default(0);
            $table->unsignedBigInteger('line_total');
            $table->text('specifications')->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('purchase_order_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('step_order');
            $table->string('role', 40);
            $table->string('status', 20)->default('pending');
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('comment')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();
            $table->unique(['purchase_order_id', 'step_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_approvals');
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
    }
};
