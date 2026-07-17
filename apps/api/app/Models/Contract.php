<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contract extends Model
{
    protected $fillable = ['tenant_id', 'supplier_id', 'owner_user_id', 'reference', 'title', 'contract_type', 'status', 'starts_at', 'ends_at', 'value_amount', 'currency', 'auto_renew', 'notice_days', 'scope', 'renewal_terms', 'activated_at', 'terminated_at', 'termination_reason'];

    protected function casts(): array
    {
        return ['starts_at' => 'date', 'ends_at' => 'date', 'value_amount' => 'integer', 'auto_renew' => 'boolean', 'notice_days' => 'integer', 'activated_at' => 'datetime', 'terminated_at' => 'datetime'];
    }

    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function owner(): BelongsTo { return $this->belongsTo(User::class, 'owner_user_id'); }
    public function documents(): HasMany { return $this->hasMany(ContractDocument::class)->latest('id'); }
    public function events(): HasMany { return $this->hasMany(ContractEvent::class)->latest('id'); }
}
