<?php
namespace App\Http\Controllers\Api\V1;
use App\Models\AppNotification;use App\Models\AutomationSetting;use App\Services\AutomationService;use Illuminate\Http\Request;
class AutomationController{
 public function settings(){return AutomationSetting::query()->firstOrCreate(['tenant_id'=>app('tenant.id')]);}
 public function update(Request $r){abort_unless(in_array($r->user()->roleForTenant(app('tenant.id')),['owner','admin'],true),403);$data=$r->validate(['email_enabled'=>['required','boolean'],'in_app_enabled'=>['required','boolean'],'rfq_reminder_days'=>['required','integer','between:0,30'],'approval_reminder_hours'=>['required','integer','between:1,720'],'delivery_reminder_days'=>['required','integer','between:0,30'],'invoice_reminder_days'=>['required','integer','between:0,60'],'document_expiry_days'=>['required','integer','between:1,365'],'contract_expiry_days'=>['required','integer','between:1,365']]);$s=AutomationSetting::query()->firstOrCreate(['tenant_id'=>app('tenant.id')]);$s->update($data);return $s;}
 public function run(Request $r,AutomationService $service){abort_unless(in_array($r->user()->roleForTenant(app('tenant.id')),['owner','admin'],true),403);return $service->run((int)app('tenant.id'));}
 public function notifications(Request $r){return AppNotification::query()->where('tenant_id',app('tenant.id'))->where('user_id',$r->user()->id)->latest('id')->paginate(20);}
 public function read(Request $r,AppNotification $notification){abort_unless($notification->tenant_id==(int)app('tenant.id')&&$notification->user_id===$r->user()->id,404);$notification->update(['read_at'=>now()]);return $notification;}
 public function readAll(Request $r){AppNotification::query()->where('tenant_id',app('tenant.id'))->where('user_id',$r->user()->id)->whereNull('read_at')->update(['read_at'=>now()]);return response()->noContent();}
}
