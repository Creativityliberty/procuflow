<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rfq_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfq_id')->constrained()->cascadeOnDelete();
            $table->foreignId('acde_item_id')->nullable()->constrained()->nullOnDelete();
            $table->string('kind', 30);
            $table->string('priority_level', 20)->default('mandatory');
            $table->text('content');
            $table->string('criterion')->nullable();
            $table->string('target_value')->nullable();
            $table->string('unit', 60)->nullable();
            $table->string('tolerance')->nullable();
            $table->text('verification_method')->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
            $table->index(['rfq_id', 'priority_level']);
        });

        Schema::create('supplier_offer_requirement_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rfq_requirement_id')->constrained()->restrictOnDelete();
            $table->string('status', 25);
            $table->text('response')->nullable();
            $table->string('evidence_reference')->nullable();
            $table->timestamps();
            $table->unique(['supplier_offer_id', 'rfq_requirement_id'], 'offer_requirement_unique');
        });

        Schema::table('supplier_offers', function (Blueprint $table) {
            $table->decimal('compliance_score', 5, 2)->default(0)->after('total_amount');
            $table->boolean('mandatory_compliant')->default(true)->after('compliance_score');
        });
    }

    public function down(): void
    {
        Schema::table('supplier_offers', fn (Blueprint $table) => $table->dropColumn(['compliance_score', 'mandatory_compliant']));
        Schema::dropIfExists('supplier_offer_requirement_responses');
        Schema::dropIfExists('rfq_requirements');
    }
};
