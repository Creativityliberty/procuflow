<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OfferAssessment extends Model
{
    protected $fillable = [
        'supplier_offer_id', 'technical_score', 'payment_score', 'warranty_score',
        'proximity_score', 'risk_level', 'assessor_notes', 'score_breakdown', 'final_score', 'rank',
    ];

    protected function casts(): array
    {
        return [
            'technical_score'=>'integer', 'payment_score'=>'integer', 'warranty_score'=>'integer',
            'proximity_score'=>'integer', 'score_breakdown'=>'array', 'final_score'=>'decimal:2', 'rank'=>'integer',
        ];
    }

    public function offer(): BelongsTo { return $this->belongsTo(SupplierOffer::class, 'supplier_offer_id'); }
}
