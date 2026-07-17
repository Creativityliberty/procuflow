<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class PurchaseOrderApproval extends Model
{
    protected $fillable=['step_order','role','status','decided_by','comment','decided_at'];
    protected function casts(): array{return ['step_order'=>'integer','decided_at'=>'datetime'];}
    public function purchaseOrder(): BelongsTo{return $this->belongsTo(PurchaseOrder::class);}
    public function decisionMaker(): BelongsTo{return $this->belongsTo(User::class,'decided_by');}
}
