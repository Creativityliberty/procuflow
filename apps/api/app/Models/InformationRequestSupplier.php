<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InformationRequestSupplier extends Model
{
    protected $fillable = ['information_request_id','supplier_id','contact_email','access_token_hash','access_token_encrypted','status','invited_at','viewed_at','submitted_at','response','response_original_name','response_storage_path','response_disk','response_mime_type','response_size_bytes'];
    protected $hidden = ['access_token_hash','access_token_encrypted','response_storage_path','response_disk'];
    protected function casts(): array { return ['invited_at'=>'datetime','viewed_at'=>'datetime','submitted_at'=>'datetime','response_size_bytes'=>'integer']; }
    public function informationRequest(): BelongsTo { return $this->belongsTo(InformationRequest::class); }
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
}
