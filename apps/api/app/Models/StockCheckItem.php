<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class StockCheckItem extends Model
{
    protected $fillable = ['purchase_request_item_id','requested_quantity','available_quantity','procurement_quantity','result','stock_location','comment'];
    protected function casts(): array { return ['requested_quantity'=>'decimal:3','available_quantity'=>'decimal:3','procurement_quantity'=>'decimal:3']; }
    public function purchaseRequestItem(): BelongsTo { return $this->belongsTo(PurchaseRequestItem::class); }
}
