<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class SupplierOfferVersion extends Model
{
    protected $fillable = ['version','status','snapshot','submitted_at'];
    protected function casts(): array { return ['snapshot'=>'array','version'=>'integer','submitted_at'=>'datetime']; }
}
