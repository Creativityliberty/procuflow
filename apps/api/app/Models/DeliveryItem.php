<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;use Illuminate\Database\Eloquent\Relations\BelongsTo;
class DeliveryItem extends Model{protected $fillable=['purchase_order_item_id','ordered_quantity','received_quantity','remaining_quantity'];protected function casts():array{return['ordered_quantity'=>'decimal:3','received_quantity'=>'decimal:3','remaining_quantity'=>'decimal:3'];}public function purchaseOrderItem():BelongsTo{return $this->belongsTo(PurchaseOrderItem::class);}}
