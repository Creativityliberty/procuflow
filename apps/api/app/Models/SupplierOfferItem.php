<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class SupplierOfferItem extends Model
{
    protected $fillable = ['rfq_item_id','quantity','unit_price','discount_percent','tax_percent','is_compliant','comment'];
    protected function casts(): array { return ['quantity'=>'decimal:3','unit_price'=>'integer','discount_percent'=>'decimal:2','tax_percent'=>'decimal:2','is_compliant'=>'boolean']; }
    public function rfqItem(): BelongsTo { return $this->belongsTo(RfqItem::class); }
}
