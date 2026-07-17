<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierStatusHistory extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'tenant_id',
        'supplier_id',
        'changed_by',
        'from_status',
        'to_status',
        'comment',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
