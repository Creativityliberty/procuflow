<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RfqRequirement extends Model
{
    protected $fillable = ['rfq_id', 'acde_item_id', 'kind', 'priority_level', 'content', 'criterion', 'target_value', 'unit', 'tolerance', 'verification_method', 'position'];
    protected function casts(): array { return ['position' => 'integer']; }
    public function rfq(): BelongsTo { return $this->belongsTo(Rfq::class); }
    public function sourceItem(): BelongsTo { return $this->belongsTo(AcdeItem::class, 'acde_item_id'); }
    public function responses(): HasMany { return $this->hasMany(SupplierOfferRequirementResponse::class); }
}
