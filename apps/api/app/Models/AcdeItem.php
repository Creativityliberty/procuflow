<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcdeItem extends Model
{
    protected $fillable = [
        'kind',
        'priority_level',
        'content',
        'criterion',
        'target_value',
        'unit',
        'tolerance',
        'verification_method',
        'position',
    ];

    protected function casts(): array
    {
        return ['position' => 'integer'];
    }

    public function need(): BelongsTo
    {
        return $this->belongsTo(AcdeNeed::class, 'acde_need_id');
    }
}
