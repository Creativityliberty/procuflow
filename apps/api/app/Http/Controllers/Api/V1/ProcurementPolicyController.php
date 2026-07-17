<?php
namespace App\Http\Controllers\Api\V1;
use App\Services\AuditService;
use App\Services\ProcurementPolicyService;
use Illuminate\Http\Request;
class ProcurementPolicyController
{
    public function __construct(private readonly ProcurementPolicyService $policies, private readonly AuditService $audit) {}
    public function show() { return ['tiers'=>$this->policies->tiers((int) app('tenant.id'))]; }
    public function update(Request $request) {
        abort_unless(in_array($request->user()->roleForTenant(app('tenant.id')), ['owner','admin','procurement_manager'], true), 403);
        $data = $request->validate(['tiers'=>['required','array','min:1','max:20'],'tiers.*.name'=>['required','string','max:80'],'tiers.*.minimum_amount'=>['required','integer','min:0'],'tiers.*.maximum_amount'=>['nullable','integer','min:0'],'tiers.*.required_quotes'=>['required','integer','min:1','max:20'],'tiers.*.competition_method'=>['required','string','max:50'],'tiers.*.validator_roles'=>['required','array','min:1'],'tiers.*.validator_roles.*'=>['required','string','max:50']]);
        $tiers = $this->policies->replace((int) app('tenant.id'), $data['tiers']);
        $this->audit->record('procurement_policy.updated', null, ['tiers'=>$tiers->count()]);
        return ['tiers'=>$tiers];
    }
}
