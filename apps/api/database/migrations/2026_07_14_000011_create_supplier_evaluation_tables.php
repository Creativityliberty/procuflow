<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('supplier_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('evaluated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedTinyInteger('credit_score');
            $table->unsignedTinyInteger('payment_terms_score');
            $table->unsignedTinyInteger('proximity_score');
            $table->unsignedTinyInteger('support_score');
            $table->unsignedTinyInteger('warranty_score');
            $table->unsignedTinyInteger('value_score');
            $table->decimal('score', 3, 2);
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'supplier_id', 'created_at']);
        });

        Schema::create('supplier_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30);
            $table->text('comment')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['tenant_id', 'supplier_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_status_histories');
        Schema::dropIfExists('supplier_evaluations');
    }
};
