<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\InformationRequestDocument;
use App\Models\InformationRequestSupplier;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class InformationRequestPortalController
{
    public function __construct(private readonly AuditService $audit) {}
    public function show(string $token){$invite=$this->invite($token);abort_unless(in_array($invite->informationRequest->status,['published','closed','archived'],true),404);if(!$invite->viewed_at&&$invite->informationRequest->status==='published')$invite->update(['viewed_at'=>now(),'status'=>'viewed']);return $this->detail($invite);}
    public function submit(Request $request,string $token){$invite=$this->invite($token);$rfi=$invite->informationRequest;abort_unless($rfi->status==='published'&&now()->lessThanOrEqualTo($rfi->response_deadline),422,'Cette demande est fermee.');$data=$request->validate(['response'=>['required','string','min:5','max:10000'],'file'=>['nullable','file','mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png','max:20480']]);$values=['response'=>$data['response'],'status'=>'submitted','submitted_at'=>now()];if($file=$request->file('file')){$disk=config('filesystems.default','private');$path=$file->storeAs("tenants/{$rfi->tenant_id}/rfi/{$rfi->id}/responses",Str::uuid().'.'.$file->getClientOriginalExtension(),$disk);if($invite->response_storage_path)Storage::disk($invite->response_disk)->delete($invite->response_storage_path);$values=[...$values,'response_original_name'=>$file->getClientOriginalName(),'response_storage_path'=>$path,'response_disk'=>$disk,'response_mime_type'=>$file->getMimeType(),'response_size_bytes'=>$file->getSize()];}$invite->update($values);app()->instance('tenant.id',$rfi->tenant_id);$this->audit->record('information_request.response_submitted',$rfi,['supplier_id'=>$invite->supplier_id]);return $this->detail($invite);}
    public function download(string $token,InformationRequestDocument $document){$invite=$this->invite($token);abort_unless(in_array($invite->informationRequest->status,['published','closed','archived'],true),404);abort_unless((int)$document->information_request_id===(int)$invite->information_request_id,404);return Storage::disk($document->disk)->download($document->storage_path,$document->original_name);}
    private function invite(string $token):InformationRequestSupplier{abort_unless(strlen($token)===64,404);return InformationRequestSupplier::query()->where('access_token_hash',hash('sha256',$token))->with(['supplier:id,legal_name,email','informationRequest.documents'])->firstOrFail();}
    private function detail(InformationRequestSupplier $invite):array{$fresh=$invite->fresh(['supplier:id,legal_name,email','informationRequest.documents']);return ['invitation'=>$fresh,'supplier'=>$fresh->supplier,'request'=>$fresh->informationRequest,'is_open'=>$fresh->informationRequest->status==='published'&&now()->lessThanOrEqualTo($fresh->informationRequest->response_deadline)];}
}
