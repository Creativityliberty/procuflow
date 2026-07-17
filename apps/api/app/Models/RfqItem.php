<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class RfqItem extends Model
{
    protected $fillable = ['purchase_request_item_id','description','quantity','unit','specifications','position'];
    protected function casts(): array { return ['quantity'=>'decimal:3','position'=>'integer']; }
}
