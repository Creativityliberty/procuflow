<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\InformationRequest;
use App\Models\InformationRequestDocument;
use App\Models\InformationRequestSupplier;
use App\Models\Supplier;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class InformationRequestController
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(Request $request)
    {
        return InformationRequest::query()->where('tenant_id',app('tenant.id'))
            ->when($request->string('status')->toString(),fn($query,$status)=>$query->where('status',$status))
            ->when($request->string('search')->toString(),fn($query,$search)=>$query->where(fn($nested)=>$nested->where('reference','like',"%{$search}%")->orWhere('subject','like',"%{$search}%")))
            ->withCount(['suppliers','suppliers as responses_count'=>fn($query)=>$query->where('status','submitted')])
            ->latest('id')->paginate(20);
    }

    public function store(Request $request)
    {
        $data=$request->validate(['subject'=>['required','string','max:255'],'description'=>['required','string','min:10','max:10000'],'category'=>['nullable','string','max:120'],'response_deadline'=>['required','date','after:now'],'supplier_ids'=>['required','array','min:1','max:100'],'supplier_ids.*'=>['integer','distinct']]);
        $suppliers=Supplier::query()->where('tenant_id',app('tenant.id'))->where('status','active')->whereNotNull('email')->where('email','!=','')->whereIn('id',$data['supplier_ids'])->get();
        abort_unless($suppliers->count()===count($data['supplier_ids']),422,'Tous les fournisseurs doivent etre actifs et disposer d une adresse e-mail.');
        $rfi=DB::transaction(function()use($request,$data,$suppliers){$rfi=InformationRequest::query()->create(['tenant_id'=>app('tenant.id'),'created_by'=>$request->user()->id,'reference'=>'TEMP-'.Str::uuid(),'subject'=>$data['subject'],'description'=>$data['description'],'category'=>$data['category']??null,'response_deadline'=>$data['response_deadline'],'status'=>'draft']);$rfi->update(['reference'=>sprintf('RFI-%s-%06d',now()->format('Y'),$rfi->id)]);foreach($suppliers as $supplier){$token=Str::random(64);$rfi->suppliers()->create(['supplier_id'=>$supplier->id,'contact_email'=>$supplier->email,'access_token_hash'=>hash('sha256',$token),'access_token_encrypted'=>Crypt::encryptString($token)]);}return $rfi;});
        $this->audit->record('information_request.created',$rfi,['suppliers'=>$suppliers->count()]);
        return response()->json($this->detail($rfi),201);
    }

    public function show(InformationRequest $informationRequest){$this->tenant($informationRequest);return $this->detail($informationRequest);}

    public function publish(InformationRequest $informationRequest)
    {
        $this->tenant($informationRequest);abort_unless($informationRequest->status==='draft',422,'Seul un brouillon peut etre publie.');abort_if($informationRequest->response_deadline->isPast(),422,'La date limite est depassee.');$links=[];
        DB::transaction(function()use($informationRequest,&$links){foreach($informationRequest->suppliers as $invite){$token=Str::random(64);$invite->update(['access_token_hash'=>hash('sha256',$token),'access_token_encrypted'=>Crypt::encryptString($token),'status'=>'invited','invited_at'=>now()]);$links[]=['supplier_id'=>$invite->supplier_id,'email'=>$invite->contact_email,'url'=>$this->portalUrl($token)];}$informationRequest->update(['status'=>'published','published_at'=>now()]);});
        foreach($links as $link){
            if($link['email'])Mail::raw("Bonjour,\n\nUne demande d'information fournisseur vous est adressee : {$informationRequest->subject}.\nReponse attendue avant le {$informationRequest->response_deadline->format('d/m/Y H:i')}.\n\nAcceder au dossier : {$link['url']}",fn($mail)=>$mail->to($link['email'])->subject("Demande d'information {$informationRequest->reference}"));
        }
        $this->audit->record('information_request.published',$informationRequest,['suppliers'=>count($links)]);return [...$this->detail($informationRequest)->toArray(),'portal_links'=>$links];
    }

    public function regenerateLink(InformationRequest $informationRequest,InformationRequestSupplier $invitation)
    {
        $this->tenant($informationRequest);abort_unless((int)$invitation->information_request_id===(int)$informationRequest->id,404);abort_unless($informationRequest->status==='published',422,'La demande doit etre en cours.');$token=Str::random(64);$invitation->update(['access_token_hash'=>hash('sha256',$token),'access_token_encrypted'=>Crypt::encryptString($token)]);$url=$this->portalUrl($token);$this->audit->record('information_request.link_regenerated',$informationRequest,['supplier_id'=>$invitation->supplier_id]);return ['url'=>$url,'email'=>$invitation->contact_email];
    }

    public function close(InformationRequest $informationRequest){$this->tenant($informationRequest);abort_unless($informationRequest->status==='published',422);$informationRequest->update(['status'=>'closed','closed_at'=>now()]);$this->audit->record('information_request.closed',$informationRequest);return $this->detail($informationRequest);}
    public function archive(InformationRequest $informationRequest){$this->tenant($informationRequest);abort_unless(in_array($informationRequest->status,['closed','published'],true),422);$informationRequest->update(['status'=>'archived','archived_at'=>now(),'closed_at'=>$informationRequest->closed_at??now()]);$this->audit->record('information_request.archived',$informationRequest);return $this->detail($informationRequest);}

    public function upload(Request $request,InformationRequest $informationRequest)
    {
        $this->tenant($informationRequest);abort_unless($informationRequest->status==='draft',422);$request->validate(['file'=>['required','file','mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png','max:20480']]);$file=$request->file('file');$disk=config('filesystems.default','private');$path=$file->storeAs("tenants/{$informationRequest->tenant_id}/rfi/{$informationRequest->id}",Str::uuid().'.'.$file->getClientOriginalExtension(),$disk);$document=$informationRequest->documents()->create(['original_name'=>$file->getClientOriginalName(),'storage_path'=>$path,'disk'=>$disk,'mime_type'=>$file->getMimeType(),'size_bytes'=>$file->getSize(),'uploaded_by'=>$request->user()->id]);$this->audit->record('information_request.document_added',$informationRequest,['document_id'=>$document->id]);return response()->json($document,201);
    }

    public function download(InformationRequest $informationRequest,InformationRequestDocument $document){$this->tenant($informationRequest);abort_unless((int)$document->information_request_id===(int)$informationRequest->id,404);return Storage::disk($document->disk)->download($document->storage_path,$document->original_name);}
    public function downloadResponse(InformationRequest $informationRequest,InformationRequestSupplier $invitation){$this->tenant($informationRequest);abort_unless((int)$invitation->information_request_id===(int)$informationRequest->id&&$invitation->response_storage_path,404);return Storage::disk($invitation->response_disk)->download($invitation->response_storage_path,$invitation->response_original_name);}

    private function detail(InformationRequest $rfi):InformationRequest{return $rfi->fresh()->load(['creator:id,name,email','documents.uploader:id,name','suppliers.supplier:id,legal_name,email,category,city,status']);}
    private function tenant(InformationRequest $rfi):void{abort_unless((int)$rfi->tenant_id===(int)app('tenant.id'),404);}
    private function portalUrl(string $token):string{return rtrim((string)config('app.frontend_url'),'/').'/supplier-portal/information-requests/'.$token;}
}
