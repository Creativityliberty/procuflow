<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rfq_comparisons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rfq_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('recommended_offer_id')->nullable()->constrained('supplier_offers')->nullOnDelete();
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('weights');
            $table->string('status', 30)->default('draft');
            $table->text('executive_summary')->nullable();
            $table->text('analysis')->nullable();
            $table->text('risks')->nullable();
            $table->text('recommendation_reason')->nullable();
            $table->text('decision_comment')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('offer_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfq_comparison_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_offer_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('technical_score')->default(70);
            $table->unsignedTinyInteger('payment_score')->default(70);
            $table->unsignedTinyInteger('warranty_score')->default(70);
            $table->unsignedTinyInteger('proximity_score')->default(70);
            $table->string('risk_level', 20)->default('low');
            $table->text('assessor_notes')->nullable();
            $table->json('score_breakdown')->nullable();
            $table->decimal('final_score', 6, 2)->default(0);
            $table->unsignedInteger('rank')->nullable();
            $table->timestamps();
            $table->unique(['rfq_comparison_id', 'supplier_offer_id']);
            $table->index(['rfq_comparison_id', 'rank']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offer_assessments');
        Schema::dropIfExists('rfq_comparisons');
    }
};
