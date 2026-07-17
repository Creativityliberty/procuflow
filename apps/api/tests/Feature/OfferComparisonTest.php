<?php

namespace Tests\Feature;

use App\Models\PurchaseRequest;
use App\Models\Rfq;
use App\Models\Supplier;
use App\Models\Tenant;
use App\Models\User;
use App\Services\OfferComparisonService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OfferComparisonTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_ranks_offers_and_approves_the_supplier_selection(): void
    {
        [$tenant, $user, $request, $rfq] = $this->fixture();
        Sanctum::actingAs($user);
        $headers = ['X-Tenant-ID'=>(string) $tenant->id];

        $generated = $this->withHeaders($headers)->postJson("/api/v1/rfqs/{$rfq->id}/comparison/generate")
            ->assertCreated()->assertJsonCount(2, 'assessments');
        $assessments = collect($generated->json('assessments'))->sortBy('rank')->values();
        $this->assertSame(1, $assessments[0]['rank']);
        $this->assertGreaterThan($assessments[1]['final_score'], $assessments[0]['final_score']);

        $winner = $assessments[0];
        $synthesis = [
            'executive_summary'=>'Deux offres conformes ont ete analysees selon les criteres approuves.',
            'analysis'=>'Le fournisseur recommande presente le meilleur compromis prix, delai et qualite.',
            'risks'=>'Risque faible, suivi contractuel mensuel recommande.',
            'recommended_offer_id'=>$winner['supplier_offer_id'],
            'recommendation_reason'=>'Cette offre obtient le meilleur score total et respecte les exigences techniques.',
        ];
        $this->withHeaders($headers)->putJson("/api/v1/rfqs/{$rfq->id}/comparison/synthesis", $synthesis)->assertOk();
        $this->withHeaders($headers)->postJson("/api/v1/rfqs/{$rfq->id}/comparison/submit")->assertJsonPath('status', 'pending_approval');
        $this->withHeaders($headers)->postJson("/api/v1/rfqs/{$rfq->id}/comparison/decision", ['decision'=>'approved','comment'=>'Choix valide.'])->assertJsonPath('status', 'approved');
        $this->assertSame('supplier_selected', $request->fresh()->status);
    }

    public function test_weights_must_total_one_hundred_percent(): void
    {
        [$tenant, $user, , $rfq] = $this->fixture();
        Sanctum::actingAs($user);
        $headers = ['X-Tenant-ID'=>(string) $tenant->id];
        $this->withHeaders($headers)->postJson("/api/v1/rfqs/{$rfq->id}/comparison/generate")->assertCreated();
        $weights = OfferComparisonService::DEFAULT_WEIGHTS;
        $weights['price'] = 34;
        $this->withHeaders($headers)->putJson("/api/v1/rfqs/{$rfq->id}/comparison/weights", ['weights'=>$weights])->assertUnprocessable();
    }

    private function fixture(): array
    {
        $tenant = Tenant::query()->create(['name'=>'Alpha','slug'=>'alpha']);
        $user = User::query()->create(['name'=>'Responsable','email'=>'manager@test.dev','password'=>'password','current_tenant_id'=>$tenant->id]);
        $tenant->users()->attach($user, ['role'=>'procurement_manager']);
        $request = PurchaseRequest::query()->create(['tenant_id'=>$tenant->id,'created_by'=>$user->id,'reference'=>'DA-COMP-1','title'=>'Equipements','service'=>'Operations','priority'=>'normal','reason'=>'Renouvellement','currency'=>'XAF','estimated_amount'=>2000000,'status'=>'in_consultation']);
        $rfq = Rfq::query()->create(['tenant_id'=>$tenant->id,'purchase_request_id'=>$request->id,'created_by'=>$user->id,'reference'=>'RFQ-COMP-1','title'=>'Equipements','currency'=>'XAF','response_deadline'=>now()->subDay(),'status'=>'closed','required_quote_count'=>2,'competition_method'=>'restricted_competition','closed_at'=>now()]);
        $rfqItem = $rfq->items()->create(['description'=>'Equipement','quantity'=>2,'unit'=>'unite','position'=>0]);

        foreach ([['A', 1800000, 8, 4.5], ['B', 2000000, 12, 3.5]] as $index => [$name, $amount, $lead, $score]) {
            $supplier = Supplier::query()->create(['tenant_id'=>$tenant->id,'legal_name'=>"Fournisseur {$name}",'niu'=>"NIU-COMP-{$name}",'email'=>strtolower($name).'@test.dev','city'=>'Douala','status'=>'active','score'=>$score]);
            $invitation = $rfq->invitedSuppliers()->create(['supplier_id'=>$supplier->id,'contact_email'=>$supplier->email,'access_token_hash'=>hash('sha256', "token-{$index}"),'token_last_four'=>(string) (1000 + $index),'status'=>'submitted','submitted_at'=>now()]);
            $offer = $invitation->offer()->create(['status'=>'submitted','currency'=>'XAF','subtotal'=>$amount,'total_amount'=>$amount,'lead_time_days'=>$lead,'validity_days'=>30,'payment_terms'=>'30 jours','warranty'=>'12 mois','current_version'=>1,'submitted_at'=>now()]);
            $offer->items()->create(['rfq_item_id'=>$rfqItem->id,'quantity'=>2,'unit_price'=>(int) ($amount / 2),'is_compliant'=>true]);
        }
        return [$tenant, $user, $request, $rfq];
    }
}
