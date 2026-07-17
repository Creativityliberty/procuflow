<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Approval;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;

class ApprovalInboxController
{
    public function __invoke(Request $request)
    {
        $tenantId = app('tenant.id');
        $role = $request->user()->roleForTenant($tenantId);

        $query = Approval::query()
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
            $query->where('approvals.role', $role);
        }

        return $query
            ->with([
                'purchaseRequest.creator:id,name,email',
                'purchaseRequest.items',
                'workflowStep',
            ])
            ->latest('approvals.id')
            ->paginate(20);
    }
}
