<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierEvaluation extends Model
{
    protected $fillable = [
        'tenant_id',
        'supplier_id',
        'evaluated_by',
        'credit_score',
        'payment_terms_score',
        'proximity_score',
        'support_score',
        'warranty_score',
        'value_score',
        'score',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'credit_score' => 'integer',
            'payment_terms_score' => 'integer',
            'proximity_score' => 'integer',
            'support_score' => 'integer',
            'warranty_score' => 'integer',
            'value_score' => 'integer',
            'score' => 'decimal:2',
        ];
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluated_by');
    }
}
