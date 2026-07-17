<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ProcurementPolicyTier extends Model
{
    protected $fillable = ['tenant_id','name','minimum_amount','maximum_amount','required_quotes','competition_method','validator_roles','position','is_active'];
    protected function casts(): array { return ['minimum_amount'=>'integer','maximum_amount'=>'integer','required_quotes'=>'integer','validator_roles'=>'array','position'=>'integer','is_active'=>'boolean']; }
}
