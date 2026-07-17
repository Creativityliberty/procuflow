<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
class RfqSupplier extends Model
{
    protected $fillable = ['supplier_id','contact_email','access_token_hash','token_last_four','token_expires_at','token_revoked_at','status','invited_at','viewed_at','declined_at','submitted_at'];
    protected $hidden = ['access_token_hash'];
    protected function casts(): array { return ['token_expires_at'=>'datetime','token_revoked_at'=>'datetime','invited_at'=>'datetime','viewed_at'=>'datetime','declined_at'=>'datetime','submitted_at'=>'datetime']; }
    public function rfq(): BelongsTo { return $this->belongsTo(Rfq::class); }
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function offer(): HasOne { return $this->hasOne(SupplierOffer::class); }
}
