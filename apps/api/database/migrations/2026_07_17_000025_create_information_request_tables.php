<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('information_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('reference')->unique();
            $table->string('subject');
            $table->text('description');
            $table->string('category')->nullable();
            $table->dateTime('response_deadline');
            $table->string('status', 25)->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('information_request_suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('information_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            $table->string('contact_email');
            $table->string('access_token_hash', 64)->unique();
            $table->text('access_token_encrypted');
            $table->string('status', 25)->default('invited');
            $table->timestamp('invited_at')->nullable();
            $table->timestamp('viewed_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->text('response')->nullable();
            $table->string('response_original_name')->nullable();
            $table->string('response_storage_path')->nullable();
            $table->string('response_disk')->nullable();
            $table->string('response_mime_type')->nullable();
            $table->unsignedBigInteger('response_size_bytes')->default(0);
            $table->timestamps();
            $table->unique(['information_request_id', 'supplier_id'], 'rfi_supplier_unique');
        });

        Schema::create('information_request_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('information_request_id')->constrained()->cascadeOnDelete();
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
        Schema::dropIfExists('information_request_documents');
        Schema::dropIfExists('information_request_suppliers');
        Schema::dropIfExists('information_requests');
    }
};
