<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RfqComparison extends Model
{
    protected $fillable = [
        'tenant_id', 'rfq_id', 'created_by', 'recommended_offer_id', 'decided_by', 'weights',
        'status', 'executive_summary', 'analysis', 'risks', 'recommendation_reason',
        'decision_comment', 'version', 'submitted_at', 'decided_at',
    ];

    protected function casts(): array
    {
        return ['weights'=>'array', 'version'=>'integer', 'submitted_at'=>'datetime', 'decided_at'=>'datetime'];
    }

    public function rfq(): BelongsTo { return $this->belongsTo(Rfq::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function recommendedOffer(): BelongsTo { return $this->belongsTo(SupplierOffer::class, 'recommended_offer_id'); }
    public function decisionMaker(): BelongsTo { return $this->belongsTo(User::class, 'decided_by'); }
    public function assessments(): HasMany { return $this->hasMany(OfferAssessment::class)->orderBy('rank'); }
}
