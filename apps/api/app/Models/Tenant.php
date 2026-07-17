<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Tenant extends Model
{
    protected $fillable = [
        'name',
        'legal_name',
        'slug',
        'rccm',
        'niu',
        'country',
        'city',
        'address',
        'company_size',
        'currency',
        'rfq_threshold',
        'default_payment_days',
        'cost_center_required',
        'onboarding_completed_at',
    ];

    protected function casts(): array
    {
        return [
            'rfq_threshold' => 'integer',
            'default_payment_days' => 'integer',
            'cost_center_required' => 'boolean',
            'onboarding_completed_at' => 'datetime',
        ];
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot(['role', 'job_title', 'joined_at'])
            ->withTimestamps();
    }

    public function suppliers(): HasMany
    {
        return $this->hasMany(Supplier::class);
    }

    public function purchaseRequests(): HasMany
    {
        return $this->hasMany(PurchaseRequest::class);
    }

    public function approvalWorkflows(): HasMany
    {
        return $this->hasMany(ApprovalWorkflow::class);
    }

    public function contracts(): HasMany { return $this->hasMany(Contract::class); }
    public function subscription(): HasOne { return $this->hasOne(TenantSubscription::class); }
}
