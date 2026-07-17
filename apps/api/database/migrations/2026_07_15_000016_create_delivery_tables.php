<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration{
 public function up():void{
  Schema::create('deliveries',function(Blueprint $t){$t->id();$t->foreignId('tenant_id')->constrained()->cascadeOnDelete();$t->foreignId('purchase_order_id')->unique()->constrained()->restrictOnDelete();$t->string('status',25)->default('pending_confirmation');$t->date('planned_at')->nullable();$t->timestamp('confirmed_at')->nullable();$t->text('supplier_comment')->nullable();$t->timestamps();$t->index(['tenant_id','status']);});
  Schema::create('delivery_items',function(Blueprint $t){$t->id();$t->foreignId('delivery_id')->constrained()->cascadeOnDelete();$t->foreignId('purchase_order_item_id')->constrained()->restrictOnDelete();$t->decimal('ordered_quantity',14,3);$t->decimal('received_quantity',14,3)->default(0);$t->decimal('remaining_quantity',14,3);$t->timestamps();$t->unique(['delivery_id','purchase_order_item_id']);});
  Schema::create('delivery_receipts',function(Blueprint $t){$t->id();$t->foreignId('delivery_id')->constrained()->cascadeOnDelete();$t->foreignId('received_by')->constrained('users')->restrictOnDelete();$t->string('reference')->unique();$t->date('received_at');$t->string('type',20);$t->text('observations')->nullable();$t->string('bl_original_name');$t->string('bl_path');$t->string('pv_original_name');$t->string('pv_path');$t->string('disk')->default('local');$t->timestamps();});
  Schema::create('delivery_receipt_items',function(Blueprint $t){$t->id();$t->foreignId('delivery_receipt_id')->constrained()->cascadeOnDelete();$t->foreignId('delivery_item_id')->constrained()->restrictOnDelete();$t->decimal('quantity_received',14,3);$t->text('observations')->nullable();$t->timestamps();});
 }
 public function down():void{Schema::dropIfExists('delivery_receipt_items');Schema::dropIfExists('delivery_receipts');Schema::dropIfExists('delivery_items');Schema::dropIfExists('deliveries');}
};
