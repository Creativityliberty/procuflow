<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('acde_needs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable();
            $table->string('title');
            $table->text('context')->nullable();
            $table->string('status')->default('draft');
            $table->string('priority')->nullable();
            $table->timestamps();
        });

        Schema::create('acde_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('acde_need_id')->constrained()->cascadeOnDelete();
            $table->string('kind');
            $table->text('content');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acde_items');
        Schema::dropIfExists('acde_needs');
    }
};

