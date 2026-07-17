<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\StoreSupplierDocumentRequest;
use App\Models\Supplier;
use App\Models\SupplierDocument;
use App\Services\AuditService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SupplierDocumentController
{
    public function __construct(private readonly AuditService $audit)
    {
    }

    public function index(Supplier $supplier)
    {
        $this->assertTenant($supplier);

        return $supplier->documents()
            ->select(['id', 'document_type', 'original_name', 'mime_type', 'size_bytes', 'expires_at', 'status', 'created_at'])
            ->latest()
            ->get();
    }

    public function store(StoreSupplierDocumentRequest $request, Supplier $supplier)
    {
        $this->assertTenant($supplier);

        $file = $request->file('file');
        $disk = config('filesystems.default', 'local');
        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs(
            "tenants/{$supplier->tenant_id}/suppliers/{$supplier->id}",
            $filename,
            $disk
        );

        $document = $supplier->documents()->create([
            'tenant_id' => $supplier->tenant_id,
            'uploaded_by' => $request->user()?->id,
            'document_type' => $request->validated('document_type'),
            'original_name' => $file->getClientOriginalName(),
            'disk' => $disk,
            'storage_path' => $path,
            'mime_type' => $file->getMimeType(),
            'size_bytes' => $file->getSize(),
            'expires_at' => $request->validated('expires_at'),
            'status' => 'pending_review',
        ]);

        $this->audit->record('supplier.document_uploaded', $supplier, [
            'document_id' => $document->id,
            'document_type' => $document->document_type,
        ]);

        return response()->json($document->only([
            'id', 'document_type', 'original_name', 'mime_type', 'size_bytes', 'expires_at', 'status', 'created_at',
        ]), 201);
    }

    public function download(Supplier $supplier, SupplierDocument $document)
    {
        $this->assertDocument($supplier, $document);

        return Storage::disk($document->disk)->download($document->storage_path, $document->original_name);
    }

    public function destroy(Supplier $supplier, SupplierDocument $document)
    {
        $this->assertDocument($supplier, $document);

        Storage::disk($document->disk)->delete($document->storage_path);
        $this->audit->record('supplier.document_deleted', $supplier, [
            'document_id' => $document->id,
            'document_type' => $document->document_type,
        ]);
        $document->delete();

        return response()->noContent();
    }

    private function assertTenant(Supplier $supplier): void
    {
        abort_unless((string) $supplier->tenant_id === (string) app('tenant.id'), 404);
    }

    private function assertDocument(Supplier $supplier, SupplierDocument $document): void
    {
        $this->assertTenant($supplier);
        abort_unless(
            (string) $document->supplier_id === (string) $supplier->id
                && (string) $document->tenant_id === (string) app('tenant.id'),
            404
        );
    }
}
