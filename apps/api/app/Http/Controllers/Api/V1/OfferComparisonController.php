<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\OfferAssessment;
use App\Models\Rfq;
use App\Models\RfqComparison;
use App\Services\AuditService;
use App\Services\OfferComparisonService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OfferComparisonController
{
    public function __construct(private readonly OfferComparisonService $service, private readonly AuditService $audit) {}

    public function show(Rfq $rfq)
    {
        $this->assertRfqTenant($rfq);
        $comparison = $rfq->comparison()->firstOrFail();
        return $this->service->detail($comparison);
    }

    public function generate(Request $request, Rfq $rfq)
    {
        $this->assertRfqTenant($rfq);
        $comparison = $this->service->createOrRefresh($rfq, $request->user()->id);
        $this->audit->record('rfq_comparison.generated', $comparison, ['rfq_id'=>$rfq->id]);
        return response()->json($comparison, 201);
    }

    public function updateWeights(Request $request, Rfq $rfq)
    {
        $comparison = $this->comparison($rfq);
        $data = $request->validate([
            'weights'=>['required','array'],
            'weights.price'=>['required','integer','min:0','max:100'],
            'weights.delivery'=>['required','integer','min:0','max:100'],
            'weights.technical'=>['required','integer','min:0','max:100'],
            'weights.payment'=>['required','integer','min:0','max:100'],
            'weights.warranty'=>['required','integer','min:0','max:100'],
            'weights.supplier_performance'=>['required','integer','min:0','max:100'],
            'weights.proximity'=>['required','integer','min:0','max:100'],
        ]);
        $updated = $this->service->updateWeights($comparison, $data['weights']);
        $this->audit->record('rfq_comparison.weights_updated', $comparison);
        return $updated;
    }

    public function updateAssessment(Request $request, Rfq $rfq, OfferAssessment $assessment)
    {
        $comparison = $this->comparison($rfq);
        abort_unless((int)$assessment->rfq_comparison_id === (int)$comparison->id, 404);
        $data = $request->validate([
            'technical_score'=>['required','integer','between:0,100'],
            'payment_score'=>['required','integer','between:0,100'],
            'warranty_score'=>['required','integer','between:0,100'],
            'proximity_score'=>['required','integer','between:0,100'],
            'risk_level'=>['required',Rule::in(['low','medium','high'])],
            'assessor_notes'=>['nullable','string','max:5000'],
        ]);
        $updated = $this->service->updateAssessment($assessment, $data);
        $this->audit->record('offer_assessment.updated', $assessment);
        return $updated;
    }

    public function updateSynthesis(Request $request, Rfq $rfq)
    {
        $comparison = $this->comparison($rfq);
        abort_unless(in_array($comparison->status, ['draft','rejected'], true), 422, 'La synthese est verrouillee.');
        $data = $request->validate([
            'executive_summary'=>['required','string','min:20','max:5000'],
            'analysis'=>['required','string','min:20','max:10000'],
            'risks'=>['required','string','min:10','max:5000'],
            'recommended_offer_id'=>['required','integer'],
            'recommendation_reason'=>['required','string','min:20','max:5000'],
        ]);
        abort_unless($comparison->assessments()->where('supplier_offer_id',$data['recommended_offer_id'])->exists(), 422, 'L offre recommandee ne fait pas partie du comparatif.');
        $recommended = $comparison->assessments()->where('supplier_offer_id',$data['recommended_offer_id'])->with('offer')->firstOrFail();
        abort_unless($recommended->offer->mandatory_compliant, 422, 'Une offre non conforme a une exigence obligatoire ne peut pas etre recommandee.');
        $comparison->update([...$data, 'version'=>$comparison->version + 1]);
        $this->audit->record('rfq_comparison.synthesis_updated', $comparison);
        return $this->service->detail($comparison);
    }

    public function submit(Rfq $rfq)
    {
        $comparison = $this->comparison($rfq);
        abort_unless(in_array($comparison->status, ['draft','rejected'], true), 422, 'Seule une synthese modifiable peut etre soumise.');
        abort_unless($comparison->recommended_offer_id && $comparison->executive_summary && $comparison->analysis && $comparison->risks && $comparison->recommendation_reason, 422, 'Completez la synthese et la recommandation avant validation.');
        abort_unless($comparison->recommendedOffer?->mandatory_compliant, 422, 'La recommandation contient une non-conformite obligatoire.');
        $comparison->update(['status'=>'pending_approval','submitted_at'=>now()]);
        $this->audit->record('rfq_comparison.submitted', $comparison);
        return $this->service->detail($comparison);
    }

    public function decide(Request $request, Rfq $rfq)
    {
        $comparison = $this->comparison($rfq);
        abort_unless($comparison->status === 'pending_approval', 422, 'Cette synthese n attend pas de decision.');
        abort_unless(in_array($request->user()->roleForTenant(app('tenant.id')),['owner','admin','director','procurement_manager'],true),403);
        $data = $request->validate(['decision'=>['required',Rule::in(['approved','rejected'])],'comment'=>['nullable','string','max:5000']]);
        $comparison->update(['status'=>$data['decision'],'decision_comment'=>$data['comment']??null,'decided_by'=>$request->user()->id,'decided_at'=>now()]);
        if ($data['decision'] === 'approved') $rfq->purchaseRequest()->update(['status'=>'supplier_selected']);
        $this->audit->record('rfq_comparison.'.$data['decision'], $comparison);
        return $this->service->detail($comparison);
    }

    private function comparison(Rfq $rfq): RfqComparison
    {
        $this->assertRfqTenant($rfq);
        return $rfq->comparison()->firstOrFail();
    }

    private function assertRfqTenant(Rfq $rfq): void { abort_unless((int)$rfq->tenant_id === (int)app('tenant.id'),404); }
}
