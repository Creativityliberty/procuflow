<?php
namespace Tests\Feature;
use App\Models\AcdeNeed;
use App\Models\PurchaseRequest;
use App\Models\StockCheck;
use App\Models\Supplier;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
class RfqWorkflowTest extends TestCase
{
    use RefreshDatabase;
    public function test_rfq_requires_stock_check_and_quote_gate(): void
    {
        $tenant=Tenant::query()->create(['name'=>'Alpha','slug'=>'alpha']);$user=User::query()->create(['name'=>'Owner','email'=>'owner@test.dev','password'=>'password','current_tenant_id'=>$tenant->id]);$tenant->users()->attach($user,['role'=>'owner']);Sanctum::actingAs($user);
        $request=PurchaseRequest::query()->create(['tenant_id'=>$tenant->id,'created_by'=>$user->id,'reference'=>'DA-TEST-1','title'=>'Ordinateurs','service'=>'Finance','priority'=>'normal','reason'=>'Renouvellement','currency'=>'XAF','estimated_amount'=>2000000,'status'=>'approved']);$item=$request->items()->create(['description'=>'Ordinateur','quantity'=>2,'unit'=>'unite','estimated_unit_price'=>1000000]);
        $suppliers=collect(range(1,3))->map(fn($i)=>Supplier::query()->create(['tenant_id'=>$tenant->id,'legal_name'=>"Fournisseur {$i}",'niu'=>"NIU-{$i}",'email'=>"f{$i}@test.dev",'status'=>'active']));$payload=['purchase_request_id'=>$request->id,'title'=>'Consultation ordinateurs','response_deadline'=>now()->addDays(7)->toIso8601String(),'supplier_ids'=>$suppliers->pluck('id')->all()];$headers=['X-Tenant-ID'=>(string)$tenant->id];
        $this->withHeaders($headers)->postJson('/api/v1/rfqs',$payload)->assertUnprocessable();
        $check=StockCheck::query()->create(['tenant_id'=>$tenant->id,'purchase_request_id'=>$request->id,'checked_by'=>$user->id,'result'=>'unavailable','checked_at'=>now()]);$check->items()->create(['purchase_request_item_id'=>$item->id,'requested_quantity'=>2,'available_quantity'=>0,'procurement_quantity'=>2,'result'=>'unavailable']);
        $created=$this->withHeaders($headers)->postJson('/api/v1/rfqs',$payload)->assertCreated()->assertJsonPath('required_quote_count',3);$id=$created->json('id');$this->withHeaders($headers)->postJson("/api/v1/rfqs/{$id}/publish")->assertOk()->assertJsonCount(3,'portal_links');$this->withHeaders($headers)->postJson("/api/v1/rfqs/{$id}/close")->assertUnprocessable();
    }

    public function test_acde_requirements_are_snapshotted_and_scored_in_the_supplier_offer(): void
    {
        $tenant=Tenant::query()->create(['name'=>'Beta','slug'=>'beta-compliance']);$user=User::query()->create(['name'=>'Owner','email'=>'owner-compliance@test.dev','password'=>'password','current_tenant_id'=>$tenant->id]);$tenant->users()->attach($user,['role'=>'owner']);Sanctum::actingAs($user);
        $need=AcdeNeed::query()->create(['tenant_id'=>$tenant->id,'created_by'=>$user->id,'title'=>'Postes durcis','service'=>'IT','status'=>'converted','priority'=>'high','currency'=>'XAF']);
        $need->items()->create(['kind'=>'requirement','priority_level'=>'mandatory','content'=>'Certification constructeur obligatoire','criterion'=>'Certification','verification_method'=>'Copie du certificat','position'=>0]);
        $need->items()->create(['kind'=>'expectation','priority_level'=>'desired','content'=>'Intervention locale sous quatre heures','criterion'=>'Delai intervention','target_value'=>'4','unit'=>'heures','position'=>1]);
        $request=PurchaseRequest::query()->create(['tenant_id'=>$tenant->id,'created_by'=>$user->id,'acde_need_id'=>$need->id,'reference'=>'DA-COMP-1','title'=>'Postes durcis','service'=>'IT','priority'=>'high','reason'=>'Renouvellement','currency'=>'XAF','estimated_amount'=>2000000,'status'=>'approved']);
        $item=$request->items()->create(['description'=>'Poste durci','quantity'=>2,'unit'=>'unite','estimated_unit_price'=>1000000]);
        $check=StockCheck::query()->create(['tenant_id'=>$tenant->id,'purchase_request_id'=>$request->id,'checked_by'=>$user->id,'result'=>'unavailable','checked_at'=>now()]);$check->items()->create(['purchase_request_item_id'=>$item->id,'requested_quantity'=>2,'available_quantity'=>0,'procurement_quantity'=>2,'result'=>'unavailable']);
        $suppliers=collect(range(1,3))->map(fn($i)=>Supplier::query()->create(['tenant_id'=>$tenant->id,'legal_name'=>"Conformite {$i}",'niu'=>"NIU-CF-{$i}",'email'=>"cf{$i}@test.dev",'status'=>'active']));$headers=['X-Tenant-ID'=>(string)$tenant->id];
        $created=$this->withHeaders($headers)->postJson('/api/v1/rfqs',['purchase_request_id'=>$request->id,'title'=>'Consultation conformite','response_deadline'=>now()->addDays(7)->toIso8601String(),'supplier_ids'=>$suppliers->pluck('id')->all()])->assertCreated()->assertJsonCount(2,'requirements');
        $id=$created->json('id');$published=$this->withHeaders($headers)->postJson("/api/v1/rfqs/{$id}/publish")->assertOk();$token=basename($published->json('portal_links.0.url'));$rfqItem=$created->json('items.0');$requirements=$created->json('requirements');
        $offer=$this->putJson("/api/v1/supplier-portal/rfqs/{$token}/offer",['currency'=>'XAF','transport_cost'=>0,'insurance_cost'=>0,'lead_time_days'=>7,'validity_days'=>30,'items'=>[['rfq_item_id'=>$rfqItem['id'],'quantity'=>2,'unit_price'=>900000,'discount_percent'=>0,'tax_percent'=>0,'is_compliant'=>true]],'requirements'=>[['rfq_requirement_id'=>$requirements[0]['id'],'status'=>'non_compliant','response'=>'Certification en cours'],['rfq_requirement_id'=>$requirements[1]['id'],'status'=>'compliant','response'=>'Equipe locale disponible']]])->assertOk();
        $offer->assertJsonPath('offer.mandatory_compliant',false)->assertJsonPath('offer.compliance_score','40.00')->assertJsonCount(2,'offer.requirement_responses');
    }
}
