<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestDocument;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PurchaseRequestDocumentController
{
    public function __construct(private readonly AuditService $audit) {}

    public function store(Request $request, PurchaseRequest $purchaseRequest)
    {
        $this->tenant($purchaseRequest);$this->canMutate($request,$purchaseRequest);abort_unless($purchaseRequest->status === 'draft', 422, 'Ajoutez les justificatifs avant envoi en validation.');
        $request->validate(['file' => ['required', 'file', 'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png', 'max:20480']]);
        $file=$request->file('file');$disk=config('filesystems.default','private');$path=$file->storeAs("tenants/{$purchaseRequest->tenant_id}/purchase-requests/{$purchaseRequest->id}",Str::uuid().'.'.$file->getClientOriginalExtension(),$disk);
        $document=$purchaseRequest->documents()->create(['original_name'=>$file->getClientOriginalName(),'storage_path'=>$path,'disk'=>$disk,'mime_type'=>$file->getMimeType(),'size_bytes'=>$file->getSize(),'uploaded_by'=>$request->user()->id]);
        $this->audit->record('purchase_request.document_added',$purchaseRequest,['document_id'=>$document->id]);
        return response()->json($document,201);
    }

    public function download(PurchaseRequest $purchaseRequest, PurchaseRequestDocument $document)
    {
        $this->tenant($purchaseRequest);abort_unless((int)$document->purchase_request_id===(int)$purchaseRequest->id,404);return Storage::disk($document->disk)->download($document->storage_path,$document->original_name);
    }

    public function destroy(PurchaseRequest $purchaseRequest, PurchaseRequestDocument $document)
    {
        $this->tenant($purchaseRequest);$this->canMutate(request(),$purchaseRequest);abort_unless((int)$document->purchase_request_id===(int)$purchaseRequest->id,404);abort_unless($purchaseRequest->status==='draft',422);Storage::disk($document->disk)->delete($document->storage_path);$document->delete();return response()->noContent();
    }

    private function tenant(PurchaseRequest $request):void{abort_unless((int)$request->tenant_id===(int)app('tenant.id'),404);}
    private function canMutate(Request $request,PurchaseRequest $purchaseRequest):void{$role=$request->user()->roleForTenant($purchaseRequest->tenant_id);abort_unless((int)$purchaseRequest->created_by===(int)$request->user()->id||in_array($role,['owner','admin','buyer','procurement_manager','manager'],true),403);}
}
