<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tenant_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('email');
            $table->string('role', 40);
            $table->foreignId('invited_by')->constrained('users')->restrictOnDelete();
            $table->string('token_hash', 64)->unique();
            $table->string('token_last_four', 4);
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'email']);
            $table->index(['tenant_id', 'expires_at']);
        });

        Schema::table('rfq_suppliers', function (Blueprint $table) {
            $table->timestamp('token_expires_at')->nullable()->after('token_last_four');
            $table->timestamp('token_revoked_at')->nullable()->after('token_expires_at');
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->timestamp('supplier_token_expires_at')->nullable()->after('supplier_token_last_four');
            $table->timestamp('supplier_token_revoked_at')->nullable()->after('supplier_token_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropColumn(['supplier_token_expires_at', 'supplier_token_revoked_at']);
        });

        Schema::table('rfq_suppliers', function (Blueprint $table) {
            $table->dropColumn(['token_expires_at', 'token_revoked_at']);
        });

        Schema::dropIfExists('tenant_invitations');
    }
};
