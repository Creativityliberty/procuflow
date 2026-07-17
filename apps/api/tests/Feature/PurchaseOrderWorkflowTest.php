<?php
namespace Tests\Feature;
use App\Models\PurchaseRequest;
use App\Models\Delivery;
use App\Models\Invoice;
use App\Models\Rfq;
use App\Models\RfqComparison;
use App\Models\Supplier;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
class PurchaseOrderWorkflowTest extends TestCase
{
    use RefreshDatabase;
    public function test_approved_selection_becomes_validated_and_sent_order(): void
    {
        $tenant=Tenant::query()->create(['name'=>'Alpha','slug'=>'alpha-po']);$user=User::query()->create(['name'=>'Owner','email'=>'po@test.dev','password'=>'password','current_tenant_id'=>$tenant->id]);$tenant->users()->attach($user,['role'=>'owner']);Sanctum::actingAs($user);$headers=['X-Tenant-ID'=>(string)$tenant->id];
        $request=PurchaseRequest::query()->create(['tenant_id'=>$tenant->id,'created_by'=>$user->id,'reference'=>'DA-PO-1','title'=>'Postes de travail','service'=>'Finance','priority'=>'normal','reason'=>'Renouvellement','currency'=>'XAF','estimated_amount'=>1800000,'status'=>'supplier_selected']);
        $rfq=Rfq::query()->create(['tenant_id'=>$tenant->id,'purchase_request_id'=>$request->id,'created_by'=>$user->id,'reference'=>'RFQ-PO-1','title'=>'Postes','currency'=>'XAF','response_deadline'=>now()->subDay(),'status'=>'closed','required_quote_count'=>1,'competition_method'=>'direct_purchase','closed_at'=>now()]);
        $item=$rfq->items()->create(['description'=>'Ordinateur portable','quantity'=>2,'unit'=>'unite','specifications'=>'16 Go RAM','position'=>0]);$supplier=Supplier::query()->create(['tenant_id'=>$tenant->id,'legal_name'=>'CamTech','niu'=>'NIU-PO-1','email'=>'orders@camtech.test','status'=>'active']);$invite=$rfq->invitedSuppliers()->create(['supplier_id'=>$supplier->id,'contact_email'=>$supplier->email,'access_token_hash'=>hash('sha256','po-offer'),'token_last_four'=>'1234','status'=>'submitted','submitted_at'=>now()]);$offer=$invite->offer()->create(['status'=>'submitted','currency'=>'XAF','subtotal'=>1800000,'total_amount'=>1800000,'lead_time_days'=>10,'validity_days'=>30,'payment_terms'=>'30 jours','incoterm'=>'DAP','current_version'=>1,'submitted_at'=>now()]);$offer->items()->create(['rfq_item_id'=>$item->id,'quantity'=>2,'unit_price'=>900000,'is_compliant'=>true]);
        $comparison=RfqComparison::query()->create(['tenant_id'=>$tenant->id,'rfq_id'=>$rfq->id,'created_by'=>$user->id,'recommended_offer_id'=>$offer->id,'weights'=>['price'=>35,'delivery'=>15,'technical'=>15,'payment'=>10,'warranty'=>10,'supplier_performance'=>10,'proximity'=>5],'status'=>'approved']);
        $created=$this->withHeaders($headers)->postJson('/api/v1/purchase-orders',['rfq_comparison_id'=>$comparison->id,'delivery_location'=>'Douala','expected_delivery_at'=>now()->addDays(15)->toDateString()])->assertCreated()->assertJsonCount(5,'approvals');$id=$created->json('id');
        $this->withHeaders($headers)->postJson("/api/v1/purchase-orders/{$id}/submit")->assertJsonPath('status','in_validation');
        foreach(range(1,5) as $step)$this->withHeaders($headers)->postJson("/api/v1/purchase-orders/{$id}/decision",['decision'=>'approved','comment'=>"Etape {$step}"])->assertOk();
        $this->withHeaders($headers)->getJson("/api/v1/purchase-orders/{$id}")->assertJsonPath('status','validated');
        $sent=$this->withHeaders($headers)->postJson("/api/v1/purchase-orders/{$id}/send")->assertOk()->assertJsonPath('purchase_order.status','sent');
        $this->assertStringContainsString('/supplier-portal/purchase-orders/',$sent->json('supplier_portal_url'));
        $this->assertSame('ordered',$request->fresh()->status);
        $token=basename($sent->json('supplier_portal_url'));
        $this->postJson("/api/v1/supplier-portal/purchase-orders/{$token}/respond",['decision'=>'accepted','comment'=>'Commande acceptee'])->assertJsonPath('status','accepted');
        $delivery=Delivery::query()->firstOrFail();
        $this->postJson("/api/v1/supplier-portal/purchase-orders/{$token}/confirm-delivery",['planned_at'=>now()->addDays(10)->toDateString()])->assertJsonPath('status','confirmed');
        Storage::fake('local');
        $deliveryItem=$delivery->items()->firstOrFail();
        $this->withHeaders($headers)->post("/api/v1/deliveries/{$delivery->id}/receipts",['received_at'=>now()->toDateString(),'bl'=>UploadedFile::fake()->create('bl.pdf',100,'application/pdf'),'pv'=>UploadedFile::fake()->create('pv.pdf',100,'application/pdf'),'items'=>[['delivery_item_id'=>$deliveryItem->id,'quantity_received'=>2]]])->assertOk()->assertJsonPath('status','complete');
        $this->post("/api/v1/supplier-portal/purchase-orders/{$token}/invoices",['invoice_number'=>'FAC-TEST-1','currency'=>'XAF','subtotal'=>1800000,'tax_amount'=>0,'total_amount'=>1800000,'issued_at'=>now()->toDateString(),'due_at'=>now()->addDays(30)->toDateString(),'file'=>UploadedFile::fake()->create('facture.pdf',100,'application/pdf')])->assertCreated();
        $invoice=Invoice::query()->firstOrFail();
        $this->withHeaders($headers)->postJson("/api/v1/invoices/{$invoice->id}/control")->assertJsonPath('status','compliant')->assertJsonPath('match_status','matched');
        $this->withHeaders($headers)->postJson("/api/v1/invoices/{$invoice->id}/transmit")->assertJsonPath('status','in_payment');
        $this->withHeaders($headers)->postJson("/api/v1/invoices/{$invoice->id}/paid",['payment_reference'=>'VIR-2026-001'])->assertJsonPath('status','paid');
    }
}
