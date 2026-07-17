<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class AcdeNeed extends Model
{
    protected $fillable = [
        'tenant_id',
        'created_by',
        'title',
        'context',
        'service',
        'needed_at',
        'status',
        'priority',
        'budget_amount',
        'currency',
        'delivery_location',
    ];

    protected function casts(): array
    {
        return ['needed_at' => 'date', 'budget_amount' => 'integer'];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(AcdeItem::class)->orderBy('position');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(AcdeDocument::class)->latest('id');
    }

    public function purchaseRequest(): HasOne
    {
        return $this->hasOne(PurchaseRequest::class);
    }
}
