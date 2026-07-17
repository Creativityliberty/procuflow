<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PurchaseRequest extends Model
{
    protected $fillable = [
        'tenant_id',
        'created_by',
        'acde_need_id',
        'reference',
        'title',
        'service',
        'cost_center',
        'project',
        'priority',
        'reason',
        'needed_at',
        'delivery_location',
        'currency',
        'estimated_amount',
        'status',
        'submitted_at',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'needed_at' => 'date',
            'estimated_amount' => 'integer',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function sourceNeed(): BelongsTo { return $this->belongsTo(AcdeNeed::class, 'acde_need_id'); }
    public function documents(): HasMany { return $this->hasMany(PurchaseRequestDocument::class)->latest('id'); }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class)->orderBy('step_order');
    }

    public function stockCheck(): HasOne { return $this->hasOne(StockCheck::class); }
    public function rfq(): HasOne { return $this->hasOne(Rfq::class); }
    public function purchaseOrder(): HasOne { return $this->hasOne(PurchaseOrder::class); }
}
