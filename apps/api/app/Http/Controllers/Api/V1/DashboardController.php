<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Approval;
use App\Models\PurchaseRequest;
use App\Models\Supplier;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;

class DashboardController
{
    public function __invoke(Request $request)
    {
        $tenantId = app('tenant.id');
        $requests = PurchaseRequest::query()->where('tenant_id', $tenantId);
        $role = $request->user()->roleForTenant($tenantId);
        $approvals = Approval::query()
            ->where('approvals.tenant_id', $tenantId)
            ->where('approvals.status', 'pending')
            ->whereNotExists(function (Builder $earlier): void {
                $earlier->selectRaw('1')
                    ->from('approvals as earlier_approvals')
                    ->whereColumn('earlier_approvals.purchase_request_id', 'approvals.purchase_request_id')
                    ->where('earlier_approvals.status', 'pending')
                    ->whereColumn('earlier_approvals.step_order', '<', 'approvals.step_order');
            });

        if (! in_array($role, ['owner', 'admin'], true)) {
            $approvals->where('role', $role);
        }

        return response()->json([
            'pending_purchase_requests' => (clone $requests)->where('status', 'pending')->count(),
            'pending_approvals' => $approvals->count(),
            'committed_amount_xaf' => (int) (clone $requests)
                ->whereIn('status', ['pending', 'approved', 'ordered'])
                ->where('currency', 'XAF')
                ->sum('estimated_amount'),
            'active_suppliers' => Supplier::query()
                ->where('tenant_id', $tenantId)
                ->where('status', 'active')
                ->count(),
            'draft_purchase_requests' => (clone $requests)->where('status', 'draft')->count(),
            'approved_purchase_requests' => (clone $requests)->where('status', 'approved')->count(),
            'recent_purchase_requests' => (clone $requests)
                ->with('creator:id,name,email')
                ->latest('id')
                ->limit(5)
                ->get(),
            'generated_at' => now()->toIso8601String(),
        ]);
    }
}
