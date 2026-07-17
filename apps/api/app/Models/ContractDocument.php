<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractDocument extends Model
{
    protected $fillable = ['contract_id', 'document_type', 'original_name', 'storage_path', 'disk', 'mime_type', 'size_bytes', 'uploaded_by'];
    protected $hidden = ['storage_path', 'disk'];
    protected function casts(): array { return ['size_bytes' => 'integer']; }
    public function contract(): BelongsTo { return $this->belongsTo(Contract::class); }
    public function uploader(): BelongsTo { return $this->belongsTo(User::class, 'uploaded_by'); }
}
