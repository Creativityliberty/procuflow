<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
class Rfq extends Model
{
    protected $fillable = ['tenant_id','purchase_request_id','created_by','reference','title','description','currency','response_deadline','delivery_location','payment_terms','status','required_quote_count','competition_method','published_at','closed_at'];
    protected function casts(): array { return ['response_deadline'=>'datetime','required_quote_count'=>'integer','published_at'=>'datetime','closed_at'=>'datetime']; }
    public function purchaseRequest(): BelongsTo { return $this->belongsTo(PurchaseRequest::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function items(): HasMany { return $this->hasMany(RfqItem::class)->orderBy('position'); }
    public function requirements(): HasMany { return $this->hasMany(RfqRequirement::class)->orderBy('position'); }
    public function invitedSuppliers(): HasMany { return $this->hasMany(RfqSupplier::class); }
    public function messages(): HasMany { return $this->hasMany(RfqMessage::class)->orderBy('created_at'); }
    public function exception(): HasOne { return $this->hasOne(ProcurementException::class); }
    public function comparison(): HasOne { return $this->hasOne(RfqComparison::class); }
}
