<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AutomationEvent extends Model{protected $fillable=['tenant_id','event_type','subject_type','subject_id','event_date','recipients_count','sent_at'];protected function casts():array{return['event_date'=>'date','recipients_count'=>'integer','sent_at'=>'datetime'];}}
