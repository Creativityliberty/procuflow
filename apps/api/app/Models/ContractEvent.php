<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractEvent extends Model
{
    protected $fillable = ['contract_id', 'user_id', 'action', 'from_status', 'to_status', 'comment'];
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
