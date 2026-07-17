<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\UpdateApprovalWorkflowRequest;
use App\Models\ApprovalWorkflow;
use App\Services\AuditService;
use Illuminate\Support\Facades\DB;

class ApprovalWorkflowController
{
    public function __construct(private readonly AuditService $audit)
    {
    }

    public function show()
    {
        return $this->currentWorkflow()->load('steps');
    }

    public function update(UpdateApprovalWorkflowRequest $request)
    {
        $workflow = $this->currentWorkflow();
        $data = $request->validated();

        DB::transaction(function () use ($workflow, $data): void {
            $workflow->update(['name' => $data['name']]);
            $workflow->steps()->delete();
            $workflow->steps()->createMany(collect($data['steps'])
                ->values()
                ->map(fn (array $step, int $index): array => [
                    ...$step,
                    'step_order' => $index + 1,
                ])
                ->all());
        });

        $this->audit->record('approval_workflow.updated', $workflow, [
            'name' => $workflow->name,
            'steps' => count($data['steps']),
        ]);

        return $workflow->fresh('steps');
    }

    private function currentWorkflow(): ApprovalWorkflow
    {
        return ApprovalWorkflow::query()
            ->where('tenant_id', app('tenant.id'))
            ->where('document_type', 'purchase_request')
            ->where('is_active', true)
            ->firstOrFail();
    }
}
