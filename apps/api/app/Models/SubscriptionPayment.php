<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionPayment extends Model
{
    protected $fillable = ['tenant_id', 'reference', 'plan_code', 'billing_cycle', 'amount', 'currency', 'status', 'dohone_request_id', 'payer_phone', 'payer_email', 'notification_payload', 'paid_at'];
    protected $hidden = ['notification_payload'];
    protected function casts(): array { return ['amount' => 'integer', 'notification_payload' => 'array', 'paid_at' => 'datetime']; }
    public function tenant(): BelongsTo { return $this->belongsTo(Tenant::class); }
}
