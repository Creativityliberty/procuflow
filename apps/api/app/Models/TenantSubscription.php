<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantSubscription extends Model
{
    protected $fillable = ['tenant_id', 'plan_code', 'status', 'billing_cycle', 'trial_ends_at', 'current_period_starts_at', 'current_period_ends_at', 'cancel_at_period_end', 'cancelled_at'];
    protected function casts(): array { return ['trial_ends_at' => 'datetime', 'current_period_starts_at' => 'datetime', 'current_period_ends_at' => 'datetime', 'cancel_at_period_end' => 'boolean', 'cancelled_at' => 'datetime']; }
    public function tenant(): BelongsTo { return $this->belongsTo(Tenant::class); }
}
