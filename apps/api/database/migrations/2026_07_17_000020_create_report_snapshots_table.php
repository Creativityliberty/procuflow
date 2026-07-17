<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('report_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('report_type', 40);
            $table->string('frequency', 20);
            $table->date('period_start');
            $table->date('period_end');
            $table->json('payload');
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('generated_at');
            $table->timestamps();

            $table->unique(['tenant_id', 'report_type', 'period_start', 'period_end']);
            $table->index(['tenant_id', 'generated_at']);
        });

        Schema::table('purchase_requests', fn (Blueprint $table) => $table->index(['tenant_id', 'created_at'], 'purchase_requests_reporting_idx'));
        Schema::table('purchase_orders', fn (Blueprint $table) => $table->index(['tenant_id', 'currency', 'created_at'], 'purchase_orders_reporting_idx'));
        Schema::table('deliveries', fn (Blueprint $table) => $table->index(['tenant_id', 'created_at'], 'deliveries_reporting_idx'));
        Schema::table('invoices', fn (Blueprint $table) => $table->index(['tenant_id', 'currency', 'created_at'], 'invoices_reporting_idx'));
    }

    public function down(): void
    {
        Schema::table('invoices', fn (Blueprint $table) => $table->dropIndex('invoices_reporting_idx'));
        Schema::table('deliveries', fn (Blueprint $table) => $table->dropIndex('deliveries_reporting_idx'));
        Schema::table('purchase_orders', fn (Blueprint $table) => $table->dropIndex('purchase_orders_reporting_idx'));
        Schema::table('purchase_requests', fn (Blueprint $table) => $table->dropIndex('purchase_requests_reporting_idx'));
        Schema::dropIfExists('report_snapshots');
    }
};
