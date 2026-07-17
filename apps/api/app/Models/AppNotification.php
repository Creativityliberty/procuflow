<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AppNotification extends Model{protected $fillable=['tenant_id','user_id','type','title','body','action_url','read_at'];protected function casts():array{return['read_at'=>'datetime'];}}
