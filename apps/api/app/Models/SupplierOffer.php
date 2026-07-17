<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class SupplierOffer extends Model
{
    protected $fillable = ['rfq_supplier_id','status','currency','subtotal','discount_amount','tax_amount','transport_cost','insurance_cost','total_amount','compliance_score','mandatory_compliant','lead_time_days','validity_days','payment_terms','warranty','incoterm','notes','current_version','submitted_at'];
    protected function casts(): array { return ['subtotal'=>'integer','discount_amount'=>'integer','tax_amount'=>'integer','transport_cost'=>'integer','insurance_cost'=>'integer','total_amount'=>'integer','compliance_score'=>'decimal:2','mandatory_compliant'=>'boolean','lead_time_days'=>'integer','validity_days'=>'integer','current_version'=>'integer','submitted_at'=>'datetime']; }
    public function items(): HasMany { return $this->hasMany(SupplierOfferItem::class); }
    public function versions(): HasMany { return $this->hasMany(SupplierOfferVersion::class)->orderByDesc('version'); }
    public function requirementResponses(): HasMany { return $this->hasMany(SupplierOfferRequirementResponse::class); }
    public function invitation(): BelongsTo { return $this->belongsTo(RfqSupplier::class, 'rfq_supplier_id'); }
}
