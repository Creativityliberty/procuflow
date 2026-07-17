<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_notification_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('subscription_payment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider', 30)->default('dohone');
            $table->string('reference')->nullable();
            $table->string('provider_request_id')->nullable();
            $table->string('status', 25);
            $table->string('reason')->nullable();
            $table->json('payload')->nullable();
            $table->string('ip_address', 64)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('received_at');
            $table->timestamps();
            $table->index(['provider', 'status', 'received_at']);
            $table->index(['reference', 'provider_request_id']);
        });

        Schema::table('acde_needs', function (Blueprint $table) {
            $table->unsignedBigInteger('budget_amount')->nullable()->after('priority');
            $table->string('currency', 8)->default('XAF')->after('budget_amount');
            $table->string('delivery_location')->nullable()->after('currency');
        });
        Schema::table('acde_items', function (Blueprint $table) {
            $table->string('priority_level', 20)->default('mandatory')->after('kind');
            $table->string('criterion')->nullable()->after('content');
            $table->string('target_value')->nullable()->after('criterion');
            $table->string('unit', 60)->nullable()->after('target_value');
            $table->string('tolerance')->nullable()->after('unit');
            $table->text('verification_method')->nullable()->after('tolerance');
        });

        Schema::create('acde_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('acde_need_id')->constrained()->cascadeOnDelete();
            $table->string('original_name');
            $table->string('storage_path');
            $table->string('disk')->default('private');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->foreignId('acde_need_id')->nullable()->after('created_by')->constrained()->nullOnDelete();
            $table->unique('acde_need_id');
            $table->string('delivery_location')->nullable()->after('needed_at');
        });
        Schema::create('purchase_request_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_request_id')->constrained()->cascadeOnDelete();
            $table->string('original_name');
            $table->string('storage_path');
            $table->string('disk')->default('private');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_request_documents');
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->dropUnique(['acde_need_id']);
            $table->dropConstrainedForeignId('acde_need_id');
            $table->dropColumn('delivery_location');
        });
        Schema::dropIfExists('acde_documents');
        Schema::table('acde_items', fn (Blueprint $table) => $table->dropColumn(['priority_level', 'criterion', 'target_value', 'unit', 'tolerance', 'verification_method']));
        Schema::table('acde_needs', fn (Blueprint $table) => $table->dropColumn(['budget_amount', 'currency', 'delivery_location']));
        Schema::dropIfExists('payment_notification_logs');
    }
};
