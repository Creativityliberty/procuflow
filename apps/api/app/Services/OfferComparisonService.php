<?php

namespace App\Services;

use App\Models\OfferAssessment;
use App\Models\Rfq;
use App\Models\RfqComparison;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class OfferComparisonService
{
    public const DEFAULT_WEIGHTS = [
        'price' => 35,
        'delivery' => 15,
        'technical' => 15,
        'payment' => 10,
        'warranty' => 10,
        'supplier_performance' => 10,
        'proximity' => 5,
    ];

    public function createOrRefresh(Rfq $rfq, int $userId): RfqComparison
    {
        abort_unless($rfq->status === 'closed', 422, 'La consultation doit etre cloturee avant la comparaison.');
        $offers = $this->submittedOffers($rfq);
        abort_if($offers->isEmpty(), 422, 'Aucune offre soumise ne peut etre comparee.');

        $comparison = DB::transaction(function () use ($rfq, $userId, $offers): RfqComparison {
            $comparison = RfqComparison::query()->firstOrCreate(
                ['rfq_id' => $rfq->id],
                ['tenant_id'=>$rfq->tenant_id, 'created_by'=>$userId, 'weights'=>self::DEFAULT_WEIGHTS, 'status'=>'draft']
            );
            abort_if(in_array($comparison->status, ['pending_approval','approved'], true), 422, 'La synthese est verrouillee pendant ou apres sa validation.');

            foreach ($offers as $offer) {
                $allCompliant = $offer->mandatory_compliant && $offer->items->every(fn ($item): bool => $item->is_compliant);
                $comparison->assessments()->firstOrCreate(
                    ['supplier_offer_id'=>$offer->id],
                    [
                        'technical_score'=>$allCompliant ? max(70, (int) round((float) $offer->compliance_score)) : min(49, (int) round((float) $offer->compliance_score)),
                        'payment_score'=>$offer->payment_terms ? 75 : 55,
                        'warranty_score'=>$offer->warranty ? 80 : 45,
                        'proximity_score'=>$offer->invitation->supplier?->city ? 75 : 55,
                        'risk_level'=>$allCompliant ? 'low' : 'high',
                    ]
                );
            }
            $comparison->assessments()->whereNotIn('supplier_offer_id', $offers->pluck('id'))->delete();
            return $comparison;
        });

        return $this->recalculate($comparison);
    }

    public function updateWeights(RfqComparison $comparison, array $weights): RfqComparison
    {
        abort_unless(in_array($comparison->status, ['draft','rejected'], true), 422, 'Les ponderations sont verrouillees.');
        abort_unless(array_sum($weights) === 100, 422, 'La somme des ponderations doit etre egale a 100 %.');
        $keys = array_keys($weights); $expected = array_keys(self::DEFAULT_WEIGHTS); sort($keys); sort($expected);
        abort_unless($keys === $expected, 422, 'Tous les criteres de notation sont requis.');
        $comparison->update(['weights'=>$weights, 'version'=>$comparison->version + 1]);
        return $this->recalculate($comparison);
    }

    public function updateAssessment(OfferAssessment $assessment, array $data): RfqComparison
    {
        $comparison = RfqComparison::query()->findOrFail($assessment->rfq_comparison_id);
        abort_unless(in_array($comparison->status, ['draft','rejected'], true), 422, 'Les evaluations sont verrouillees.');
        $assessment->update($data);
        $comparison->increment('version');
        return $this->recalculate($comparison->fresh());
    }

    public function recalculate(RfqComparison $comparison): RfqComparison
    {
        $comparison->load('assessments.offer.invitation.supplier');
        $assessments = $comparison->assessments;
        $prices = $assessments->map(fn ($row) => max(1, (int) $row->offer->total_amount));
        $leads = $assessments->map(fn ($row) => max(1, (int) ($row->offer->lead_time_days ?? 3650)));
        $lowestPrice = $prices->min();
        $fastestLead = $leads->min();
        $weights = $comparison->weights;

        foreach ($assessments as $assessment) {
            $offer = $assessment->offer;
            $raw = [
                'price' => round(($lowestPrice / max(1, $offer->total_amount)) * 100, 2),
                'delivery' => round(($fastestLead / max(1, $offer->lead_time_days ?? 3650)) * 100, 2),
                'technical' => $assessment->technical_score,
                'payment' => $assessment->payment_score,
                'warranty' => $assessment->warranty_score,
                'supplier_performance' => round(min(5, (float) ($offer->invitation->supplier?->score ?? 2.5)) * 20, 2),
                'proximity' => $assessment->proximity_score,
            ];
            $breakdown = [];
            $total = 0;
            foreach ($weights as $criterion => $weight) {
                $points = round($raw[$criterion] * $weight / 100, 2);
                $breakdown[$criterion] = ['score'=>$raw[$criterion], 'weight'=>$weight, 'points'=>$points];
                $total += $points;
            }
            $penalty = match ($assessment->risk_level) { 'high'=>10, 'medium'=>4, default=>0 };
            $breakdown['risk_penalty'] = $penalty;
            $assessment->update(['score_breakdown'=>$breakdown, 'final_score'=>max(0, round($total - $penalty, 2))]);
        }

        $ranked = $comparison->assessments()->orderByDesc('final_score')->orderBy('supplier_offer_id')->get();
        foreach ($ranked as $index => $assessment) $assessment->update(['rank'=>$index + 1]);

        return $this->detail($comparison);
    }

    public function detail(RfqComparison $comparison): RfqComparison
    {
        return $comparison->fresh()->load([
            'creator:id,name,email', 'decisionMaker:id,name,email',
            'recommendedOffer.invitation.supplier:id,legal_name,email,category,city,score',
            'assessments.offer.items', 'assessments.offer.requirementResponses.requirement',
            'assessments.offer.invitation.supplier:id,legal_name,email,category,city,score',
        ]);
    }

    private function submittedOffers(Rfq $rfq): Collection
    {
        return $rfq->invitedSuppliers()->where('status','submitted')
            ->with(['offer.items','offer.requirementResponses.requirement','offer.invitation.supplier'])
            ->get()->pluck('offer')->filter()->values();
    }
}
