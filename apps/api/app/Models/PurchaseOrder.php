<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
class PurchaseOrder extends Model
{
    protected $fillable=['tenant_id','purchase_request_id','rfq_comparison_id','supplier_id','supplier_offer_id','created_by','reference','status','currency','subtotal','discount_amount','tax_amount','transport_cost','insurance_cost','total_amount','payment_terms','incoterm','delivery_location','expected_delivery_at','notes','signature_hash','signed_at','supplier_token_hash','supplier_token_last_four','supplier_token_expires_at','supplier_token_revoked_at','submitted_at','validated_at','sent_at','supplier_responded_at'];
    protected $hidden=['supplier_token_hash'];
    protected function casts(): array{return ['subtotal'=>'integer','discount_amount'=>'integer','tax_amount'=>'integer','transport_cost'=>'integer','insurance_cost'=>'integer','total_amount'=>'integer','expected_delivery_at'=>'date','signed_at'=>'datetime','supplier_token_expires_at'=>'datetime','supplier_token_revoked_at'=>'datetime','submitted_at'=>'datetime','validated_at'=>'datetime','sent_at'=>'datetime','supplier_responded_at'=>'datetime'];}
    public function purchaseRequest(): BelongsTo{return $this->belongsTo(PurchaseRequest::class);}
    public function comparison(): BelongsTo{return $this->belongsTo(RfqComparison::class,'rfq_comparison_id');}
    public function supplier(): BelongsTo{return $this->belongsTo(Supplier::class);}
    public function offer(): BelongsTo{return $this->belongsTo(SupplierOffer::class,'supplier_offer_id');}
    public function creator(): BelongsTo{return $this->belongsTo(User::class,'created_by');}
    public function items(): HasMany{return $this->hasMany(PurchaseOrderItem::class)->orderBy('position');}
    public function approvals(): HasMany{return $this->hasMany(PurchaseOrderApproval::class)->orderBy('step_order');}
    public function delivery(): HasOne{return $this->hasOne(Delivery::class);}
    public function invoices(): HasMany{return $this->hasMany(Invoice::class);}
}
