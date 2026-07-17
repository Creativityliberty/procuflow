<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class PurchaseOrderItem extends Model
{
    protected $fillable=['description','quantity','unit','unit_price','discount_percent','tax_percent','line_total','specifications','position'];
    protected function casts(): array{return ['quantity'=>'decimal:3','unit_price'=>'integer','discount_percent'=>'decimal:2','tax_percent'=>'decimal:2','line_total'=>'integer','position'=>'integer'];}
}
