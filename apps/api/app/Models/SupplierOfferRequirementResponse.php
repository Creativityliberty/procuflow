<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierOfferRequirementResponse extends Model
{
    protected $fillable = ['supplier_offer_id', 'rfq_requirement_id', 'status', 'response', 'evidence_reference'];
    public function offer(): BelongsTo { return $this->belongsTo(SupplierOffer::class, 'supplier_offer_id'); }
    public function requirement(): BelongsTo { return $this->belongsTo(RfqRequirement::class, 'rfq_requirement_id'); }
}
