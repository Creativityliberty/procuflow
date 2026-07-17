<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('procurement_policy_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->unsignedBigInteger('minimum_amount');
            $table->unsignedBigInteger('maximum_amount')->nullable();
            $table->unsignedTinyInteger('required_quotes');
            $table->string('competition_method', 50);
            $table->json('validator_roles');
            $table->unsignedTinyInteger('position');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['tenant_id', 'position']);
        });

        Schema::create('stock_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purchase_request_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('checked_by')->constrained('users')->restrictOnDelete();
            $table->string('result', 30);
            $table->text('notes')->nullable();
            $table->timestamp('checked_at');
            $table->timestamps();
            $table->index(['tenant_id', 'result']);
        });

        Schema::create('stock_check_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_check_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purchase_request_item_id')->constrained()->cascadeOnDelete();
            $table->decimal('requested_quantity', 14, 3);
            $table->decimal('available_quantity', 14, 3)->default(0);
            $table->decimal('procurement_quantity', 14, 3);
            $table->string('result', 30);
            $table->string('stock_location', 120)->nullable();
            $table->text('comment')->nullable();
            $table->timestamps();
            $table->unique(['stock_check_id', 'purchase_request_item_id']);
        });

        Schema::create('rfqs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purchase_request_id')->constrained()->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('reference')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('currency', 8)->default('XAF');
            $table->dateTime('response_deadline');
            $table->string('delivery_location', 255)->nullable();
            $table->text('payment_terms')->nullable();
            $table->string('status', 30)->default('draft');
            $table->unsignedTinyInteger('required_quote_count');
            $table->string('competition_method', 50);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('rfq_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfq_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purchase_request_item_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description');
            $table->decimal('quantity', 14, 3);
            $table->string('unit', 40);
            $table->text('specifications')->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('rfq_suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfq_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            $table->string('contact_email');
            $table->string('access_token_hash', 64)->unique();
            $table->string('token_last_four', 4);
            $table->string('status', 30)->default('invited');
            $table->timestamp('invited_at')->nullable();
            $table->timestamp('viewed_at')->nullable();
            $table->timestamp('declined_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->unique(['rfq_id', 'supplier_id']);
        });

        Schema::create('supplier_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfq_supplier_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('status', 30)->default('draft');
            $table->string('currency', 8)->default('XAF');
            $table->unsignedBigInteger('subtotal')->default(0);
            $table->unsignedBigInteger('discount_amount')->default(0);
            $table->unsignedBigInteger('tax_amount')->default(0);
            $table->unsignedBigInteger('transport_cost')->default(0);
            $table->unsignedBigInteger('insurance_cost')->default(0);
            $table->unsignedBigInteger('total_amount')->default(0);
            $table->unsignedInteger('lead_time_days')->nullable();
            $table->unsignedInteger('validity_days')->default(30);
            $table->text('payment_terms')->nullable();
            $table->text('warranty')->nullable();
            $table->string('incoterm', 20)->nullable();
            $table->text('notes')->nullable();
            $table->unsignedInteger('current_version')->default(0);
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('supplier_offer_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rfq_item_id')->constrained()->restrictOnDelete();
            $table->decimal('quantity', 14, 3);
            $table->unsignedBigInteger('unit_price');
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->decimal('tax_percent', 5, 2)->default(0);
            $table->boolean('is_compliant')->default(true);
            $table->text('comment')->nullable();
            $table->timestamps();
            $table->unique(['supplier_offer_id', 'rfq_item_id']);
        });

        Schema::create('supplier_offer_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_offer_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->string('status', 30);
            $table->json('snapshot');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->unique(['supplier_offer_id', 'version']);
        });

        Schema::create('rfq_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfq_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rfq_supplier_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('sender_type', 20);
            $table->text('body');
            $table->boolean('is_internal')->default(false);
            $table->timestamps();
        });

        Schema::create('procurement_exceptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rfq_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 30);
            $table->text('justification');
            $table->string('evidence_reference', 255)->nullable();
            $table->string('status', 20)->default('pending');
            $table->text('decision_comment')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('procurement_exceptions');
        Schema::dropIfExists('rfq_messages');
        Schema::dropIfExists('supplier_offer_versions');
        Schema::dropIfExists('supplier_offer_items');
        Schema::dropIfExists('supplier_offers');
        Schema::dropIfExists('rfq_suppliers');
        Schema::dropIfExists('rfq_items');
        Schema::dropIfExists('rfqs');
        Schema::dropIfExists('stock_check_items');
        Schema::dropIfExists('stock_checks');
        Schema::dropIfExists('procurement_policy_tiers');
    }
};
