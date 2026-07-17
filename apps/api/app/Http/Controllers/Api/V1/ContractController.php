<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Contract;
use App\Models\ContractDocument;
use App\Models\Supplier;
use App\Models\Tenant;
use App\Models\User;
use App\Services\AuditService;
use App\Services\ContractService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ContractController
{
    public function __construct(private readonly ContractService $contracts, private readonly AuditService $audit)
    {
    }

    public function index(Request $request)
    {
        $this->contracts->refreshStatuses((int) app('tenant.id'));
        return Contract::query()->where('tenant_id', app('tenant.id'))
            ->when($request->string('status')->toString(), fn ($query, $status) => $query->where('status', $status))
            ->when($request->string('search')->toString(), fn ($query, $search) => $query->where(fn ($nested) => $nested->where('reference', 'like', "%{$search}%")->orWhere('title', 'like', "%{$search}%")))
            ->when($request->boolean('expiring'), fn ($query) => $query->whereIn('status', ['expiring', 'expired']))
            ->with(['supplier:id,legal_name,category', 'owner:id,name,email'])->withCount('documents')->orderBy('ends_at')->paginate(20);
    }

    public function summary()
    {
        $this->contracts->refreshStatuses((int) app('tenant.id'));
        $query = Contract::query()->where('tenant_id', app('tenant.id'));
        return ['active' => (clone $query)->where('status', 'active')->count(), 'expiring' => (clone $query)->where('status', 'expiring')->count(), 'expired' => (clone $query)->where('status', 'expired')->count(), 'total_value' => (int) (clone $query)->whereIn('status', ['active', 'expiring'])->sum('value_amount')];
    }

    public function options()
    {
        $tenant = Tenant::query()->findOrFail(app('tenant.id'));
        return ['suppliers' => Supplier::query()->where('tenant_id', $tenant->id)->where('status', 'active')->orderBy('legal_name')->get(['id', 'legal_name', 'category']), 'owners' => $tenant->users()->select('users.id', 'users.name', 'users.email')->orderBy('users.name')->get()];
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());
        $this->assertRelations((int) $data['supplier_id'], (int) $data['owner_user_id']);
        $contract = Contract::query()->create([...$data, 'tenant_id' => app('tenant.id'), 'reference' => Str::upper($data['reference']), 'status' => 'draft']);
        $contract->events()->create(['user_id' => $request->user()->id, 'action' => 'created', 'to_status' => 'draft']);
        $this->audit->record('contract.created', $contract);
        return response()->json($this->detail($contract), 201);
    }

    public function show(Contract $contract)
    {
        $this->tenant($contract);$this->contracts->refreshStatuses($contract->tenant_id);return $this->detail($contract->fresh());
    }

    public function update(Request $request, Contract $contract)
    {
        $this->tenant($contract);abort_unless(in_array($contract->status, ['draft', 'active', 'expiring'], true), 422, 'Ce contrat ne peut plus etre modifie.');
        $data = $request->validate($this->rules($contract));$this->assertRelations((int) $data['supplier_id'], (int) $data['owner_user_id']);$contract->update([...$data, 'reference' => Str::upper($data['reference'])]);$contract->events()->create(['user_id' => $request->user()->id, 'action' => 'updated', 'from_status' => $contract->status, 'to_status' => $contract->status]);$this->audit->record('contract.updated', $contract);return $this->detail($contract);
    }

    public function activate(Request $request, Contract $contract)
    {
        $this->tenant($contract);abort_unless($contract->status === 'draft', 422, 'Seul un brouillon peut etre active.');abort_unless($contract->documents()->where('document_type','signed_contract')->exists(), 422, 'Ajoutez le contrat signe avant activation.');abort_if($contract->ends_at->lt(today()),422,'Un contrat deja expire ne peut pas etre active.');$from=$contract->status;$status=$contract->ends_at->lessThanOrEqualTo(today()->addDays($contract->notice_days))?'expiring':'active';$contract->update(['status'=>$status,'activated_at'=>now()]);$contract->events()->create(['user_id'=>$request->user()->id,'action'=>'activated','from_status'=>$from,'to_status'=>$status]);$this->audit->record('contract.activated',$contract);return $this->detail($contract);
    }

    public function renew(Request $request, Contract $contract)
    {
        $this->tenant($contract);abort_unless(in_array($contract->status,['active','expiring','expired'],true),422,'Ce contrat ne peut pas etre renouvele.');$data=$request->validate(['ends_at'=>['required','date','after:'.max(today()->toDateString(),$contract->ends_at->toDateString())],'value_amount'=>['nullable','integer','min:0'],'comment'=>['nullable','string','max:3000']]);$from=$contract->status;$status=Carbon::parse($data['ends_at'])->lessThanOrEqualTo(today()->addDays($contract->notice_days))?'expiring':'active';$contract->update(['ends_at'=>$data['ends_at'],'value_amount'=>$data['value_amount']??$contract->value_amount,'status'=>$status,'terminated_at'=>null,'termination_reason'=>null]);$contract->events()->create(['user_id'=>$request->user()->id,'action'=>'renewed','from_status'=>$from,'to_status'=>$status,'comment'=>$data['comment']??null]);$this->audit->record('contract.renewed',$contract);return $this->detail($contract);
    }

    public function terminate(Request $request, Contract $contract)
    {
        $this->tenant($contract);abort_if(in_array($contract->status,['terminated','draft'],true),422,'Ce contrat ne peut pas etre resilie.');$data=$request->validate(['reason'=>['required','string','min:10','max:5000']]);$from=$contract->status;$contract->update(['status'=>'terminated','terminated_at'=>now(),'termination_reason'=>$data['reason']]);$contract->events()->create(['user_id'=>$request->user()->id,'action'=>'terminated','from_status'=>$from,'to_status'=>'terminated','comment'=>$data['reason']]);$this->audit->record('contract.terminated',$contract);return $this->detail($contract);
    }

    public function destroy(Contract $contract)
    {
        $this->tenant($contract);abort_unless($contract->status==='draft',422,'Seul un brouillon peut etre supprime.');foreach($contract->documents as $document)Storage::disk($document->disk)->delete($document->storage_path);$contract->delete();return response()->noContent();
    }

    public function uploadDocument(Request $request, Contract $contract)
    {
        $this->tenant($contract);$data=$request->validate(['document_type'=>['required',Rule::in(['signed_contract','amendment','renewal','termination','other'])],'file'=>['required','file','mimes:pdf,doc,docx,jpg,jpeg,png','max:20480']]);$file=$request->file('file');$disk=config('filesystems.default','local');$path=$file->storeAs("tenants/{$contract->tenant_id}/contracts/{$contract->id}",Str::uuid().'.'.$file->getClientOriginalExtension(),$disk);$document=$contract->documents()->create(['document_type'=>$data['document_type'],'original_name'=>$file->getClientOriginalName(),'storage_path'=>$path,'disk'=>$disk,'mime_type'=>$file->getMimeType(),'size_bytes'=>$file->getSize(),'uploaded_by'=>$request->user()->id]);$contract->events()->create(['user_id'=>$request->user()->id,'action'=>'document_added','comment'=>$document->original_name]);$this->audit->record('contract.document_added',$contract,['document_id'=>$document->id]);return response()->json($document,201);
    }

    public function downloadDocument(Contract $contract, ContractDocument $document)
    {
        $this->tenant($contract);abort_unless((int)$document->contract_id===(int)$contract->id,404);return Storage::disk($document->disk)->download($document->storage_path,$document->original_name);
    }

    public function deleteDocument(Contract $contract, ContractDocument $document)
    {
        $this->tenant($contract);abort_unless((int)$document->contract_id===(int)$contract->id,404);abort_if($contract->status!=='draft'&&$document->document_type==='signed_contract'&&$contract->documents()->where('document_type','signed_contract')->count()<=1,422,'Le contrat signe principal doit rester archive.');Storage::disk($document->disk)->delete($document->storage_path);$document->delete();return response()->noContent();
    }

    private function rules(?Contract $contract=null): array
    {
        return ['supplier_id'=>['required','integer'],'owner_user_id'=>['required','integer'],'reference'=>['required','string','max:80',Rule::unique('contracts')->where('tenant_id',app('tenant.id'))->ignore($contract?->id)],'title'=>['required','string','max:255'],'contract_type'=>['required',Rule::in(['framework','service','supply','maintenance','consulting','lease','other'])],'starts_at'=>['required','date'],'ends_at'=>['required','date','after:starts_at'],'value_amount'=>['required','integer','min:0'],'currency'=>['required','string','max:8'],'auto_renew'=>['required','boolean'],'notice_days'=>['required','integer','between:1,365'],'scope'=>['nullable','string','max:10000'],'renewal_terms'=>['nullable','string','max:10000']];
    }

    private function assertRelations(int $supplierId,int $ownerId):void{abort_unless(Supplier::query()->where('tenant_id',app('tenant.id'))->whereKey($supplierId)->exists(),422,'Fournisseur invalide.');abort_unless(Tenant::query()->findOrFail(app('tenant.id'))->users()->whereKey($ownerId)->exists(),422,'Responsable invalide.');}
    private function detail(Contract $contract):Contract{return $contract->fresh()->load(['supplier:id,legal_name,email,phone,category','owner:id,name,email','documents.uploader:id,name','events.user:id,name']);}
    private function tenant(Contract $contract):void{abort_unless((int)$contract->tenant_id===(int)app('tenant.id'),404);}
}
