<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\StoreSupplierOfferRequest;
use App\Models\RfqSupplier;
use App\Models\SupplierOffer;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierPortalController
{
    public function __construct(private readonly AuditService $audit) {}

    public function show(string $token)
    {
        $invite=$this->invitation($token);abort_unless(in_array($invite->rfq->status,['published','closed'],true),404);
        if($invite->viewed_at===null&&$invite->rfq->status==='published')$invite->update(['viewed_at'=>now(),'status'=>'viewed']);
        return $this->detail($invite);
    }

    public function saveOffer(StoreSupplierOfferRequest $request,string $token)
    {
        $invite=$this->invitation($token);$this->assertOpen($invite);abort_if($invite->status==='declined',422);
        $data=$request->validated();abort_unless(collect($data['items'])->pluck('rfq_item_id')->sort()->values()->all()===$invite->rfq->items->pluck('id')->sort()->values()->all(),422,'Chaque ligne doit recevoir un prix.');
        $requirementData=collect($data['requirements']??[]);unset($data['requirements']);$requirements=$invite->rfq->requirements;
        abort_unless($requirementData->pluck('rfq_requirement_id')->sort()->values()->all()===$requirements->pluck('id')->sort()->values()->all(),422,'Chaque exigence du cahier des charges doit recevoir une reponse.');
        $responses=$requirementData->keyBy('rfq_requirement_id');$weights=['mandatory'=>3,'desired'=>2,'comfort'=>1];$scores=['compliant'=>100,'partial'=>50,'non_compliant'=>0,'not_applicable'=>0];$maximum=0;$earned=0;$mandatoryCompliant=true;
        foreach($requirements as $requirement){$weight=$weights[$requirement->priority_level]??1;$status=$responses->get($requirement->id)['status'];$maximum+=$weight*100;$earned+=$weight*($scores[$status]??0);if($requirement->priority_level==='mandatory'&&$status!=='compliant')$mandatoryCompliant=false;}
        $complianceScore=$maximum>0?round($earned/$maximum*100,2):100;
        $subtotal=0;$discount=0;$tax=0;
        $items=collect($data['items'])->map(function($item)use(&$subtotal,&$discount,&$tax){$base=(int)round((float)$item['quantity']*(int)$item['unit_price']);$d=(int)round($base*(float)($item['discount_percent']??0)/100);$t=(int)round(($base-$d)*(float)($item['tax_percent']??0)/100);$subtotal+=$base;$discount+=$d;$tax+=$t;return [...$item,'discount_percent'=>$item['discount_percent']??0,'tax_percent'=>$item['tax_percent']??0];});
        $offer=DB::transaction(function()use($data,$items,$subtotal,$discount,$tax,$invite,$requirementData,$complianceScore,$mandatoryCompliant):SupplierOffer{$transport=(int)($data['transport_cost']??0);$insurance=(int)($data['insurance_cost']??0);$offer=SupplierOffer::query()->updateOrCreate(['rfq_supplier_id'=>$invite->id],[...collect($data)->except('items')->all(),'subtotal'=>$subtotal,'discount_amount'=>$discount,'tax_amount'=>$tax,'total_amount'=>$subtotal-$discount+$tax+$transport+$insurance,'compliance_score'=>$complianceScore,'mandatory_compliant'=>$mandatoryCompliant,'status'=>'draft','submitted_at'=>null]);$offer->items()->delete();$offer->items()->createMany($items->all());$offer->requirementResponses()->delete();$offer->requirementResponses()->createMany($requirementData->values()->all());$version=$offer->current_version+1;$offer->update(['current_version'=>$version]);$fresh=$offer->fresh(['items','requirementResponses.requirement']);$offer->versions()->create(['version'=>$version,'status'=>'draft','snapshot'=>$fresh->toArray()]);$invite->update(['status'=>'offer_draft','submitted_at'=>null]);return $fresh;});
        $this->bindTenant($invite);$this->audit->record('supplier_offer.saved',$offer,['version'=>$offer->current_version]);return $this->detail($invite);
    }

    public function submitOffer(string $token)
    {
        $invite=$this->invitation($token);$this->assertOpen($invite);$offer=$invite->offer;abort_unless($offer,422,'Enregistrez votre offre avant de l envoyer.');
        abort_unless($offer->requirementResponses()->count()===$invite->rfq->requirements()->count(),422,'Completez la matrice de conformite avant l envoi.');
        DB::transaction(function()use($offer,$invite){$version=$offer->current_version+1;$offer->update(['status'=>'submitted','submitted_at'=>now(),'current_version'=>$version]);$offer->versions()->create(['version'=>$version,'status'=>'submitted','snapshot'=>$offer->fresh(['items','requirementResponses.requirement'])->toArray(),'submitted_at'=>now()]);$invite->update(['status'=>'submitted','submitted_at'=>now()]);});
        $this->bindTenant($invite);$this->audit->record('supplier_offer.submitted',$offer,['version'=>$offer->current_version]);return $this->detail($invite);
    }

    public function decline(Request $request,string $token)
    {
        $invite=$this->invitation($token);$this->assertOpen($invite);$data=$request->validate(['reason'=>['nullable','string','max:3000']]);$invite->update(['status'=>'declined','declined_at'=>now()]);if(!empty($data['reason']))$invite->rfq->messages()->create(['rfq_supplier_id'=>$invite->id,'sender_type'=>'supplier','body'=>$data['reason']]);$this->bindTenant($invite);$this->audit->record('rfq.invitation_declined',$invite);return $this->detail($invite);
    }

    public function message(Request $request,string $token)
    {
        $invite=$this->invitation($token);$this->assertOpen($invite);$data=$request->validate(['body'=>['required','string','max:5000']]);$message=$invite->rfq->messages()->create(['rfq_supplier_id'=>$invite->id,'sender_type'=>'supplier','body'=>$data['body']]);$this->bindTenant($invite);$this->audit->record('rfq.supplier_message_sent',$invite->rfq);return response()->json($message,201);
    }

    private function invitation(string $token):RfqSupplier{abort_unless(strlen($token)===64,404);return RfqSupplier::query()->where('access_token_hash',hash('sha256',$token))->whereNull('token_revoked_at')->where(fn($q)=>$q->whereNull('token_expires_at')->orWhere('token_expires_at','>=',now()))->with(['supplier:id,legal_name,email,category,city','rfq.items','rfq.requirements','rfq.messages'=>fn($q)=>$q->where('is_internal',false),'offer.items','offer.requirementResponses.requirement','offer.versions:id,supplier_offer_id,version,status,submitted_at,created_at'])->firstOrFail();}
    private function assertOpen(RfqSupplier $invite):void{abort_unless($invite->rfq->status==='published',422,'Cette consultation est fermee.');abort_if(now()->greaterThan($invite->rfq->response_deadline),422,'La date limite est depassee.');}
    private function detail(RfqSupplier $invite):array{$fresh=$invite->fresh(['supplier:id,legal_name,email,category,city','rfq.items','rfq.requirements','rfq.messages'=>fn($q)=>$q->where('is_internal',false),'offer.items','offer.requirementResponses.requirement','offer.versions:id,supplier_offer_id,version,status,submitted_at,created_at']);$fresh->rfq->setRelation('messages',$fresh->rfq->messages->filter(fn($m)=>$m->rfq_supplier_id===null||(int)$m->rfq_supplier_id===(int)$fresh->id)->values());return ['invitation'=>$fresh->only(['id','status','invited_at','viewed_at','declined_at','submitted_at']),'supplier'=>$fresh->supplier,'rfq'=>$fresh->rfq,'offer'=>$fresh->offer,'is_open'=>$fresh->rfq->status==='published'&&now()->lessThanOrEqualTo($fresh->rfq->response_deadline)];}
    private function bindTenant(RfqSupplier $invite):void{app()->instance('tenant.id',$invite->rfq->tenant_id);}
}
