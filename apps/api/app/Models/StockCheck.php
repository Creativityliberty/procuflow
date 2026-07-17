<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class StockCheck extends Model
{
    protected $fillable = ['tenant_id','purchase_request_id','checked_by','result','notes','checked_at'];
    protected function casts(): array { return ['checked_at'=>'datetime']; }
    public function checker(): BelongsTo { return $this->belongsTo(User::class, 'checked_by'); }
    public function items(): HasMany { return $this->hasMany(StockCheckItem::class); }
}
