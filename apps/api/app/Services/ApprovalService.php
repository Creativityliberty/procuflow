<?php

namespace App\Services;

use App\Models\Approval;
use App\Models\ApprovalWorkflow;
use App\Models\PurchaseRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ApprovalService
{
    public function __construct(private readonly AuditService $audit)
    {
    }

    public function submit(PurchaseRequest $purchaseRequest, User $user): PurchaseRequest
    {
        abort_unless($purchaseRequest->status === 'draft', 422, 'Only a draft can be submitted.');

        return DB::transaction(function () use ($purchaseRequest, $user): PurchaseRequest {
            $workflow = ApprovalWorkflow::query()
                ->where('tenant_id', $purchaseRequest->tenant_id)
                ->where('document_type', 'purchase_request')
                ->where('is_active', true)
                ->with('steps')
                ->firstOrFail();

            $steps = $workflow->steps->filter(function ($step) use ($purchaseRequest): bool {
                return $purchaseRequest->estimated_amount >= $step->minimum_amount
                    && ($step->maximum_amount === null || $purchaseRequest->estimated_amount <= $step->maximum_amount);
            });

            abort_if($steps->isEmpty(), 422, 'No approval step matches this amount.');

            foreach ($steps as $step) {
                $purchaseRequest->approvals()->create([
                    'tenant_id' => $purchaseRequest->tenant_id,
                    'approval_workflow_step_id' => $step->id,
                    'step_order' => $step->step_order,
                    'role' => $step->role,
                    'status' => 'pending',
                ]);
            }

            $purchaseRequest->update([
                'status' => 'pending',
                'submitted_at' => now(),
            ]);

            $this->audit->record('purchase_request.submitted', $purchaseRequest, [
                'reference' => $purchaseRequest->reference,
                'steps' => $steps->count(),
                'submitted_by' => $user->id,
            ]);

            return $purchaseRequest->fresh(['items', 'approvals']);
        });
    }

    public function approve(PurchaseRequest $purchaseRequest, User $user, ?string $comment = null): PurchaseRequest
    {
        return $this->decide($purchaseRequest, $user, 'approved', $comment);
    }

    public function reject(PurchaseRequest $purchaseRequest, User $user, string $comment): PurchaseRequest
    {
        return $this->decide($purchaseRequest, $user, 'rejected', $comment);
    }

    private function decide(PurchaseRequest $purchaseRequest, User $user, string $decision, ?string $comment): PurchaseRequest
    {
        abort_unless($purchaseRequest->status === 'pending', 422, 'This request is not awaiting approval.');

        return DB::transaction(function () use ($purchaseRequest, $user, $decision, $comment): PurchaseRequest {
            /** @var Approval|null $approval */
            $approval = $purchaseRequest->approvals()
                ->where('status', 'pending')
                ->orderBy('step_order')
                ->lockForUpdate()
                ->first();

            abort_unless($approval, 422, 'No pending approval step.');

            $role = $user->roleForTenant($purchaseRequest->tenant_id);
            abort_unless(in_array($role, ['owner', 'admin', $approval->role], true), 403);

            $approval->update([
                'status' => $decision,
                'approver_id' => $user->id,
                'comment' => $comment,
                'decided_at' => now(),
            ]);

            if ($decision === 'rejected') {
                $purchaseRequest->update(['status' => 'rejected']);
            } elseif (! $purchaseRequest->approvals()->where('status', 'pending')->exists()) {
                $purchaseRequest->update(['status' => 'approved', 'approved_at' => now()]);
            }

            $this->audit->record("purchase_request.{$decision}", $purchaseRequest, [
                'approval_id' => $approval->id,
                'role' => $role,
            ]);

            return $purchaseRequest->fresh(['items', 'approvals']);
        });
    }
}
