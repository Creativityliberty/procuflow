<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    protected $fillable = [
        'tenant_id',
        'legal_name',
        'rccm',
        'niu',
        'email',
        'phone',
        'contact_name',
        'category',
        'address',
        'city',
        'country',
        'bank_name',
        'iban',
        'swift',
        'products',
        'services',
        'payment_terms_days',
        'status',
        'score',
    ];

    protected function casts(): array
    {
        return [
            'payment_terms_days' => 'integer',
            'score' => 'decimal:2',
            'products' => 'array',
            'services' => 'array',
        ];
    }

    public function documents(): HasMany
    {
        return $this->hasMany(SupplierDocument::class);
    }

    public function evaluations(): HasMany
    {
        return $this->hasMany(SupplierEvaluation::class)->latest('id');
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(SupplierStatusHistory::class)->latest('id');
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }
}
