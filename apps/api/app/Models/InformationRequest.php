<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InformationRequest extends Model
{
    protected $fillable = ['tenant_id','created_by','reference','subject','description','category','response_deadline','status','published_at','closed_at','archived_at'];
    protected function casts(): array { return ['response_deadline'=>'datetime','published_at'=>'datetime','closed_at'=>'datetime','archived_at'=>'datetime']; }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function suppliers(): HasMany { return $this->hasMany(InformationRequestSupplier::class); }
    public function documents(): HasMany { return $this->hasMany(InformationRequestDocument::class)->latest('id'); }
}
