<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentNotificationLog extends Model
{
    protected $fillable = ['tenant_id', 'subscription_payment_id', 'provider', 'reference', 'provider_request_id', 'status', 'reason', 'payload', 'ip_address', 'user_agent', 'received_at'];
    protected function casts(): array { return ['payload' => 'array', 'received_at' => 'datetime']; }
}
