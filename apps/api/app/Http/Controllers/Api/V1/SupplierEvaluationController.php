<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Supplier;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierEvaluationController
{
    public function __construct(private readonly AuditService $audit)
    {
    }

    public function index(Supplier $supplier)
    {
        $this->assertTenant($supplier);

        return $supplier->evaluations()
            ->with('evaluator:id,name,email')
            ->paginate(20);
    }

    public function store(Request $request, Supplier $supplier)
    {
        $this->assertTenant($supplier);
        abort_unless(in_array(
            $request->user()->roleForTenant(app('tenant.id')),
            ['owner', 'admin', 'buyer', 'procurement_manager'],
            true
        ), 403);

        $data = $request->validate([
            'credit_score' => ['required', 'integer', 'between:1,5'],
            'payment_terms_score' => ['required', 'integer', 'between:1,5'],
            'proximity_score' => ['required', 'integer', 'between:1,5'],
            'support_score' => ['required', 'integer', 'between:1,5'],
            'warranty_score' => ['required', 'integer', 'between:1,5'],
            'value_score' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:5000'],
        ]);

        $score = round(collect($data)->only([
            'credit_score',
            'payment_terms_score',
            'proximity_score',
            'support_score',
            'warranty_score',
            'value_score',
        ])->average(), 2);

        $evaluation = DB::transaction(function () use ($supplier, $request, $data, $score) {
            $evaluation = $supplier->evaluations()->create([
                ...$data,
                'tenant_id' => $supplier->tenant_id,
                'evaluated_by' => $request->user()->id,
                'score' => $score,
            ]);
            $supplier->update(['score' => $score]);

            return $evaluation;
        });

        $this->audit->record('supplier.evaluated', $supplier, [
            'evaluation_id' => $evaluation->id,
            'score' => $score,
        ]);

        return response()->json($evaluation->load('evaluator:id,name,email'), 201);
    }

    private function assertTenant(Supplier $supplier): void
    {
        abort_unless((int) $supplier->tenant_id === (int) app('tenant.id'), 404);
    }
}
