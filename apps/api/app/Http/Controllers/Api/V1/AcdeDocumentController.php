<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\AcdeDocument;
use App\Models\AcdeNeed;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AcdeDocumentController
{
    public function __construct(private readonly AuditService $audit) {}

    public function store(Request $request, AcdeNeed $acdeNeed)
    {
        $this->tenant($acdeNeed);
        $this->canMutate($request, $acdeNeed);
        abort_unless($acdeNeed->status === 'draft', 422, 'Le cahier des charges doit etre en brouillon.');
        $request->validate(['file' => ['required', 'file', 'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png', 'max:20480']]);
        $file = $request->file('file');
        $disk = config('filesystems.default', 'private');
        $path = $file->storeAs("tenants/{$acdeNeed->tenant_id}/acde/{$acdeNeed->id}", Str::uuid().'.'.$file->getClientOriginalExtension(), $disk);
        $document = $acdeNeed->documents()->create(['original_name' => $file->getClientOriginalName(), 'storage_path' => $path, 'disk' => $disk, 'mime_type' => $file->getMimeType(), 'size_bytes' => $file->getSize(), 'uploaded_by' => $request->user()->id]);
        $this->audit->record('acde_need.document_added', $acdeNeed, ['document_id' => $document->id]);
        return response()->json($document, 201);
    }

    public function download(AcdeNeed $acdeNeed, AcdeDocument $document)
    {
        $this->tenant($acdeNeed);abort_unless((int) $document->acde_need_id === (int) $acdeNeed->id, 404);
        return Storage::disk($document->disk)->download($document->storage_path, $document->original_name);
    }

    public function destroy(AcdeNeed $acdeNeed, AcdeDocument $document)
    {
        $this->tenant($acdeNeed);$this->canMutate(request(), $acdeNeed);abort_unless((int) $document->acde_need_id === (int) $acdeNeed->id, 404);abort_unless($acdeNeed->status === 'draft', 422);
        Storage::disk($document->disk)->delete($document->storage_path);$document->delete();
        return response()->noContent();
    }

    private function tenant(AcdeNeed $need): void { abort_unless((int) $need->tenant_id === (int) app('tenant.id'), 404); }
    private function canMutate(Request $request, AcdeNeed $need): void { $role=$request->user()->roleForTenant($need->tenant_id);abort_unless((int)$need->created_by===(int)$request->user()->id||in_array($role,['owner','admin','buyer','procurement_manager','manager'],true),403); }
}
