<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class RfqMessage extends Model
{
    protected $fillable = ['rfq_supplier_id','user_id','sender_type','body','is_internal'];
    protected function casts(): array { return ['is_internal'=>'boolean']; }
}
