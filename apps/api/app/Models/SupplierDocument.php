<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierDocument extends Model
{
    protected $fillable = [
        'tenant_id',
        'supplier_id',
        'uploaded_by',
        'document_type',
        'original_name',
        'disk',
        'storage_path',
        'mime_type',
        'size_bytes',
        'expires_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'date',
            'size_bytes' => 'integer',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
