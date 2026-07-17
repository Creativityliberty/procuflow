<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\StoreSupplierRequest;
use App\Models\Supplier;
use App\Models\Tenant;
use App\Services\AuditService;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierController
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly SubscriptionService $subscriptions,
    )
    {
    }

    public function index(Request $request)
    {
        return Supplier::query()
            ->where('tenant_id', app('tenant.id'))
            ->when($request->string('status')->toString(), fn ($query, $status) => $query->where('status', $status))
            ->when($request->string('category')->toString(), fn ($query, $category) => $query->where('category', $category))
            ->when($request->string('search')->toString(), function ($query, $search): void {
                $query->where(function ($nested) use ($search): void {
                    $nested->where('legal_name', 'like', "%{$search}%")
                        ->orWhere('niu', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->withCount('documents')
            ->latest('id')
            ->paginate(20);
    }

    public function store(StoreSupplierRequest $request)
    {
        $this->subscriptions->assertWithinLimit(Tenant::query()->findOrFail(app('tenant.id')), 'suppliers');

        $supplier = DB::transaction(function () use ($request): Supplier {
            $supplier = Supplier::query()->create([
                ...$request->validated(),
                'tenant_id' => app('tenant.id'),
                'status' => 'draft',
            ]);

            $supplier->statusHistory()->create([
                'tenant_id' => $supplier->tenant_id,
                'changed_by' => $request->user()->id,
                'from_status' => null,
                'to_status' => 'draft',
                'comment' => 'Creation du dossier fournisseur.',
            ]);

            return $supplier;
        });

        $this->audit->record('supplier.created', $supplier, ['legal_name' => $supplier->legal_name]);

        return response()->json($supplier, 201);
    }

    public function show(Supplier $supplier)
    {
        $this->assertTenant($supplier);

        return $supplier->load([
            'documents',
            'evaluations.evaluator:id,name,email',
            'statusHistory.user:id,name,email',
        ]);
    }

    public function update(StoreSupplierRequest $request, Supplier $supplier)
    {
        $this->assertTenant($supplier);
        $supplier->update($request->validated());
        $this->audit->record('supplier.updated', $supplier, ['fields' => array_keys($request->validated())]);

        return $supplier->fresh('documents');
    }

    public function destroy(Supplier $supplier)
    {
        $this->assertTenant($supplier);
        abort_if($supplier->status === 'active', 422, 'Un fournisseur actif doit etre desactive avant suppression.');

        $this->audit->record('supplier.deleted', $supplier, ['legal_name' => $supplier->legal_name]);
        $supplier->delete();

        return response()->noContent();
    }

    public function submit(Request $request, Supplier $supplier)
    {
        $this->assertTenant($supplier);
        abort_unless(in_array(
            $request->user()->roleForTenant(app('tenant.id')),
            ['owner', 'admin', 'buyer', 'procurement_manager'],
            true
        ), 403);

        return $this->transition($request, $supplier, ['draft'], 'pending', 'supplier.submitted');
    }

    public function approve(Request $request, Supplier $supplier)
    {
        $this->assertTenant($supplier);
        abort_unless(in_array(
            $request->user()->roleForTenant(app('tenant.id')),
            ['owner', 'admin', 'procurement_manager'],
            true
        ), 403);

        return $this->transition($request, $supplier, ['pending'], 'active', 'supplier.approved');
    }

    public function suspend(Request $request, Supplier $supplier)
    {
        $this->assertTenant($supplier);
        abort_unless(in_array(
            $request->user()->roleForTenant(app('tenant.id')),
            ['owner', 'admin', 'procurement_manager'],
            true
        ), 403);

        return $this->transition($request, $supplier, ['active', 'inactive'], 'suspended', 'supplier.suspended');
    }

    public function reactivate(Request $request, Supplier $supplier)
    {
        $this->assertTenant($supplier);
        abort_unless(in_array(
            $request->user()->roleForTenant(app('tenant.id')),
            ['owner', 'admin', 'procurement_manager'],
            true
        ), 403);

        return $this->transition($request, $supplier, ['inactive', 'suspended'], 'active', 'supplier.reactivated');
    }

    private function transition(Request $request, Supplier $supplier, array $from, string $to, string $action)
    {
        $validated = $request->validate(['comment' => ['nullable', 'string', 'max:2000']]);
        $previous = null;

        $supplier = DB::transaction(function () use ($supplier, $from, $to, $validated, $request, &$previous): Supplier {
            $supplier = Supplier::query()->lockForUpdate()->findOrFail($supplier->id);
            abort_unless(in_array($supplier->status, $from, true), 422, 'Transition de statut impossible.');
            $previous = $supplier->status;

            $supplier->update(['status' => $to]);
            $supplier->statusHistory()->create([
                'tenant_id' => $supplier->tenant_id,
                'changed_by' => $request->user()->id,
                'from_status' => $previous,
                'to_status' => $to,
                'comment' => $validated['comment'] ?? null,
            ]);

            return $supplier;
        });

        $this->audit->record($action, $supplier, [
            'from_status' => $previous,
            'to_status' => $to,
        ]);

        return $supplier->fresh(['documents', 'evaluations.evaluator:id,name,email', 'statusHistory.user:id,name,email']);
    }

    private function assertTenant(Supplier $supplier): void
    {
        abort_unless((int) $supplier->tenant_id === (int) app('tenant.id'), 404);
    }
}
