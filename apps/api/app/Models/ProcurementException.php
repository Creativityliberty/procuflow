<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ProcurementException extends Model
{
    protected $fillable = ['tenant_id','rfq_id','requested_by','decided_by','type','justification','evidence_reference','status','decision_comment','decided_at'];
    protected function casts(): array { return ['decided_at'=>'datetime']; }
}
