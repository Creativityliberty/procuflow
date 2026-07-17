<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            $table->foreignId('owner_user_id')->constrained('users')->restrictOnDelete();
            $table->string('reference');
            $table->string('title');
            $table->string('contract_type', 60)->default('framework');
            $table->string('status', 25)->default('draft');
            $table->date('starts_at');
            $table->date('ends_at');
            $table->unsignedBigInteger('value_amount')->default(0);
            $table->string('currency', 8)->default('XAF');
            $table->boolean('auto_renew')->default(false);
            $table->unsignedSmallInteger('notice_days')->default(90);
            $table->text('scope')->nullable();
            $table->text('renewal_terms')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('terminated_at')->nullable();
            $table->text('termination_reason')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'reference']);
            $table->index(['tenant_id', 'status', 'ends_at']);
            $table->index(['tenant_id', 'owner_user_id']);
        });

        Schema::create('contract_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->string('document_type', 40);
            $table->string('original_name');
            $table->string('storage_path');
            $table->string('disk')->default('local');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('contract_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 40);
            $table->string('from_status', 25)->nullable();
            $table->string('to_status', 25)->nullable();
            $table->text('comment')->nullable();
            $table->timestamps();
        });

        Schema::create('tenant_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('plan_code', 30)->default('growth');
            $table->string('status', 25)->default('trial');
            $table->string('billing_cycle', 20)->default('monthly');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_starts_at')->nullable();
            $table->timestamp('current_period_ends_at')->nullable();
            $table->boolean('cancel_at_period_end')->default(false);
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });

        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('reference')->unique();
            $table->string('plan_code', 30);
            $table->string('billing_cycle', 20);
            $table->unsignedBigInteger('amount');
            $table->string('currency', 8)->default('XAF');
            $table->string('status', 25)->default('pending');
            $table->string('dohone_request_id')->nullable()->unique();
            $table->string('payer_phone', 30);
            $table->string('payer_email')->nullable();
            $table->json('notification_payload')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status']);
        });

        Schema::table('automation_settings', function (Blueprint $table) {
            $table->unsignedSmallInteger('contract_expiry_days')->default(90)->after('document_expiry_days');
        });
    }

    public function down(): void
    {
        Schema::table('automation_settings', fn (Blueprint $table) => $table->dropColumn('contract_expiry_days'));
        Schema::dropIfExists('subscription_payments');
        Schema::dropIfExists('tenant_subscriptions');
        Schema::dropIfExists('contract_events');
        Schema::dropIfExists('contract_documents');
        Schema::dropIfExists('contracts');
    }
};
