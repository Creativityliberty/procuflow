<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\StorePurchaseRequestRequest;
use App\Models\PurchaseRequest;
use App\Models\AcdeNeed;
use App\Services\ApprovalService;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PurchaseRequestController
{
    public function __construct(
        private readonly ApprovalService $approvals,
        private readonly AuditService $audit,
    ) {
    }

    public function index(Request $request)
    {
        return PurchaseRequest::query()
            ->where('tenant_id', app('tenant.id'))
            ->when($request->string('status')->toString(), fn ($query, $status) => $query->where('status', $status))
            ->when($request->string('search')->toString(), function ($query, $search): void {
                $query->where(function ($nested) use ($search): void {
                    $nested->where('reference', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%");
                });
            })
            ->with(['creator:id,name,email'])
            ->withCount('items')
            ->latest('id')
            ->paginate(20);
    }

    public function store(StorePurchaseRequestRequest $request)
    {
        $data = $request->validated();
        if (! empty($data['acde_need_id'])) {
            $sourceNeed = AcdeNeed::query()->where('tenant_id', app('tenant.id'))->whereKey($data['acde_need_id'])->where('status', 'draft')->whereDoesntHave('purchaseRequest')->first();
            abort_unless($sourceNeed, 422, 'Ce cahier des charges est invalide ou deja transforme.');
        }
        $items = $data['items'];
        unset($data['items'], $data['action']);

        $estimatedAmount = (int) round(collect($items)->sum(
            fn (array $item): float => (float) $item['quantity'] * (int) ($item['estimated_unit_price'] ?? 0)
        ));

        $purchaseRequest = DB::transaction(function () use ($request, $data, $items, $estimatedAmount): PurchaseRequest {
            $purchaseRequest = PurchaseRequest::query()->create([
                ...$data,
                'tenant_id' => app('tenant.id'),
                'created_by' => $request->user()->id,
                'reference' => 'TEMP-'.Str::uuid(),
                'currency' => $data['currency'] ?? 'XAF',
                'estimated_amount' => $estimatedAmount,
                'status' => 'draft',
            ]);

            $purchaseRequest->update([
                'reference' => sprintf('DA-%s-%06d', now()->format('Y'), $purchaseRequest->id),
            ]);
            $purchaseRequest->items()->createMany($items);
            if ($purchaseRequest->acde_need_id) {
                AcdeNeed::query()->whereKey($purchaseRequest->acde_need_id)->update(['status' => 'converted']);
            }

            return $purchaseRequest;
        });

        $this->audit->record('purchase_request.created', $purchaseRequest, [
            'reference' => $purchaseRequest->reference,
            'estimated_amount' => $estimatedAmount,
        ]);

        if ($request->validated('action') === 'submit') {
            $purchaseRequest = $this->approvals->submit($purchaseRequest, $request->user());
        }

        return response()->json($purchaseRequest->load(['items', 'approvals']), 201);
    }

    public function show(PurchaseRequest $purchaseRequest)
    {
        $this->assertTenant($purchaseRequest);

        return $purchaseRequest->load([
            'items',
            'stockCheck.items.purchaseRequestItem',
            'stockCheck.checker:id,name,email',
            'rfq:id,purchase_request_id,reference,status',
            'creator:id,name,email',
            'approvals.workflowStep',
            'approvals.approver:id,name,email',
            'sourceNeed.documents.uploader:id,name',
            'documents.uploader:id,name',
        ]);
    }

    public function update(StorePurchaseRequestRequest $request, PurchaseRequest $purchaseRequest)
    {
        $this->assertTenant($purchaseRequest);
        abort_unless($purchaseRequest->status === 'draft', 422, 'Seul un brouillon peut etre modifie.');

        $data = $request->validated();
        $items = $data['items'] ?? null;
        abort_if(array_key_exists('acde_need_id', $data) && (int) $data['acde_need_id'] !== (int) $purchaseRequest->acde_need_id, 422, 'Le cahier des charges source est immuable apres creation.');
        unset($data['items'], $data['action']);

        if ($items !== null) {
            $data['estimated_amount'] = (int) round(collect($items)->sum(
                fn (array $item): float => (float) $item['quantity'] * (int) ($item['estimated_unit_price'] ?? 0)
            ));
        }

        DB::transaction(function () use ($purchaseRequest, $data, $items): void {
            $purchaseRequest->update($data);
            if ($items !== null) {
                $purchaseRequest->items()->delete();
                $purchaseRequest->items()->createMany($items);
            }
        });

        $this->audit->record('purchase_request.updated', $purchaseRequest);

        if ($request->validated('action') === 'submit') {
            return $this->approvals->submit($purchaseRequest, $request->user());
        }

        return $purchaseRequest->fresh(['items', 'approvals']);
    }

    public function destroy(PurchaseRequest $purchaseRequest)
    {
        $this->assertTenant($purchaseRequest);
        abort_unless($purchaseRequest->status === 'draft', 422, 'Seul un brouillon peut etre supprime.');

        $this->audit->record('purchase_request.deleted', $purchaseRequest, ['reference' => $purchaseRequest->reference]);
        foreach ($purchaseRequest->documents as $document) Storage::disk($document->disk)->delete($document->storage_path);
        $purchaseRequest->delete();

        return response()->noContent();
    }

    public function submit(Request $request, PurchaseRequest $purchaseRequest)
    {
        $this->assertTenant($purchaseRequest);

        return $this->approvals->submit($purchaseRequest, $request->user());
    }

    public function approve(Request $request, PurchaseRequest $purchaseRequest)
    {
        $this->assertTenant($purchaseRequest);
        $validated = $request->validate(['comment' => ['nullable', 'string', 'max:2000']]);

        return $this->approvals->approve($purchaseRequest, $request->user(), $validated['comment'] ?? null);
    }

    public function reject(Request $request, PurchaseRequest $purchaseRequest)
    {
        $this->assertTenant($purchaseRequest);
        $validated = $request->validate(['comment' => ['required', 'string', 'max:2000']]);

        return $this->approvals->reject($purchaseRequest, $request->user(), $validated['comment']);
    }

    private function assertTenant(PurchaseRequest $purchaseRequest): void
    {
        abort_unless((int) $purchaseRequest->tenant_id === (int) app('tenant.id'), 404);
    }
}
