<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\PurchaseOrder;
use App\Models\RfqComparison;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PurchaseOrderController
{
    private const STEPS = ['buyer','manager','finance','controller','director'];

    public function __construct(private readonly AuditService $audit) {}

    public function index(Request $request)
    {
        $query=PurchaseOrder::query()->where('tenant_id',app('tenant.id'))->with('supplier:id,legal_name')->withCount('items')->latest('id');
        if($request->filled('status'))$query->where('status',$request->string('status'));
        return $query->paginate(20);
    }

    public function store(Request $request)
    {
        $data=$request->validate(['rfq_comparison_id'=>['required','integer'],'delivery_location'=>['nullable','string','max:255'],'expected_delivery_at'=>['nullable','date'],'notes'=>['nullable','string','max:5000']]);
        $comparison=RfqComparison::query()->where('tenant_id',app('tenant.id'))->whereKey($data['rfq_comparison_id'])->with(['rfq.purchaseRequest','recommendedOffer.items.rfqItem','recommendedOffer.invitation.supplier'])->firstOrFail();
        abort_unless($comparison->status==='approved'&&$comparison->recommendedOffer,422,'Une recommandation approuvee est requise.');
        abort_if(PurchaseOrder::query()->where('rfq_comparison_id',$comparison->id)->exists(),422,'Un bon de commande existe deja pour cette selection.');
        $offer=$comparison->recommendedOffer;$supplier=$offer->invitation->supplier;
        $order=DB::transaction(function()use($request,$data,$comparison,$offer,$supplier){
            $order=PurchaseOrder::query()->create(['tenant_id'=>app('tenant.id'),'purchase_request_id'=>$comparison->rfq->purchase_request_id,'rfq_comparison_id'=>$comparison->id,'supplier_id'=>$supplier->id,'supplier_offer_id'=>$offer->id,'created_by'=>$request->user()->id,'reference'=>'BC-'.now()->format('Ymd-His').'-'.strtoupper(Str::random(4)),'status'=>'created','currency'=>$offer->currency,'subtotal'=>$offer->subtotal,'discount_amount'=>$offer->discount_amount,'tax_amount'=>$offer->tax_amount,'transport_cost'=>$offer->transport_cost,'insurance_cost'=>$offer->insurance_cost,'total_amount'=>$offer->total_amount,'payment_terms'=>$offer->payment_terms,'incoterm'=>$offer->incoterm,'delivery_location'=>$data['delivery_location']??$comparison->rfq->delivery_location,'expected_delivery_at'=>$data['expected_delivery_at']??null,'notes'=>$data['notes']??null]);
            foreach($offer->items as $position=>$item){$base=(float)$item->quantity*$item->unit_price*(1-(float)$item->discount_percent/100);$line=(int)round($base*(1+(float)$item->tax_percent/100));$order->items()->create(['description'=>$item->rfqItem->description,'quantity'=>$item->quantity,'unit'=>$item->rfqItem->unit,'unit_price'=>$item->unit_price,'discount_percent'=>$item->discount_percent,'tax_percent'=>$item->tax_percent,'line_total'=>$line,'specifications'=>$item->rfqItem->specifications,'position'=>$position]);}
            foreach(self::STEPS as $position=>$role)$order->approvals()->create(['step_order'=>$position+1,'role'=>$role]);
            return $order;
        });
        $this->audit->record('purchase_order.created',$order,['comparison_id'=>$comparison->id]);
        return response()->json($this->detail($order),201);
    }

    public function show(PurchaseOrder $purchaseOrder){$this->assertTenant($purchaseOrder);return $this->detail($purchaseOrder);}

    public function update(Request $request,PurchaseOrder $purchaseOrder)
    {
        $this->assertTenant($purchaseOrder);abort_unless($purchaseOrder->status==='created',422,'Seul un brouillon peut etre modifie.');
        $data=$request->validate(['payment_terms'=>['nullable','string','max:5000'],'incoterm'=>['nullable','string','max:20'],'delivery_location'=>['required','string','max:255'],'expected_delivery_at'=>['required','date'],'notes'=>['nullable','string','max:5000']]);
        $purchaseOrder->update($data);$this->audit->record('purchase_order.updated',$purchaseOrder);return $this->detail($purchaseOrder);
    }

    public function submit(PurchaseOrder $purchaseOrder)
    {
        $this->assertTenant($purchaseOrder);abort_unless($purchaseOrder->status==='created',422,'Ce bon de commande ne peut pas etre soumis.');abort_unless($purchaseOrder->delivery_location&&$purchaseOrder->expected_delivery_at,422,'Renseignez le lieu et la date de livraison.');
        $purchaseOrder->approvals()->where('status','rejected')->update(['status'=>'pending','decided_by'=>null,'comment'=>null,'decided_at'=>null]);
        $purchaseOrder->update(['status'=>'in_validation','submitted_at'=>now()]);$this->audit->record('purchase_order.submitted',$purchaseOrder);return $this->detail($purchaseOrder);
    }

    public function decide(Request $request,PurchaseOrder $purchaseOrder)
    {
        $this->assertTenant($purchaseOrder);abort_unless($purchaseOrder->status==='in_validation',422,'Ce bon de commande n attend pas de decision.');
        $data=$request->validate(['decision'=>['required',Rule::in(['approved','rejected'])],'comment'=>['nullable','string','max:5000']]);
        $step=$purchaseOrder->approvals()->where('status','pending')->orderBy('step_order')->firstOrFail();$role=$request->user()->roleForTenant(app('tenant.id'));
        $allowed=['owner','admin'];$aliases=['buyer'=>['buyer','procurement_manager'],'manager'=>['manager','procurement_manager'],'finance'=>['finance'],'controller'=>['controller'],'director'=>['director']];
        abort_unless(in_array($role,$allowed,true)||in_array($role,$aliases[$step->role]??[],true),403,'Ce niveau de validation ne correspond pas a votre role.');
        $step->update(['status'=>$data['decision'],'decided_by'=>$request->user()->id,'comment'=>$data['comment']??null,'decided_at'=>now()]);
        if($data['decision']==='rejected')$purchaseOrder->update(['status'=>'created']);elseif(!$purchaseOrder->approvals()->where('status','pending')->exists()){$seal=hash_hmac('sha256',$purchaseOrder->reference.'|'.$purchaseOrder->supplier_id.'|'.$purchaseOrder->total_amount.'|'.$purchaseOrder->items()->orderBy('position')->get()->toJson(),config('app.key'));$purchaseOrder->update(['status'=>'validated','validated_at'=>now(),'signed_at'=>now(),'signature_hash'=>$seal]);}
        $this->audit->record('purchase_order.'.$data['decision'],$purchaseOrder,['step'=>$step->step_order,'role'=>$step->role]);return $this->detail($purchaseOrder);
    }

    public function send(PurchaseOrder $purchaseOrder)
    {
        $this->assertTenant($purchaseOrder);abort_unless($purchaseOrder->status==='validated',422,'Le bon de commande doit etre valide avant envoi.');$token=Str::random(64);
        $purchaseOrder->update(['status'=>'sent','supplier_token_hash'=>hash('sha256',$token),'supplier_token_last_four'=>substr($token,-4),'supplier_token_expires_at'=>now()->addDays(90),'supplier_token_revoked_at'=>null,'sent_at'=>now()]);$purchaseOrder->purchaseRequest()->update(['status'=>'ordered']);$url=config('app.frontend_url').'/supplier-portal/purchase-orders/'.$token;$supplier=$purchaseOrder->supplier;
        if($supplier?->email)Mail::raw("Bonjour,\n\nLe bon de commande {$purchaseOrder->reference} est disponible ici : {$url}\n\nMerci de confirmer votre acceptation ou votre refus.",fn($mail)=>$mail->to($supplier->email)->subject("Bon de commande {$purchaseOrder->reference}"));
        $this->audit->record('purchase_order.sent',$purchaseOrder);return response()->json(['purchase_order'=>$this->detail($purchaseOrder),'supplier_portal_url'=>$url]);
    }

    public function revokeLink(PurchaseOrder $purchaseOrder)
    {
        $this->assertTenant($purchaseOrder);abort_unless($purchaseOrder->supplier_token_hash,422,'Aucun lien fournisseur actif.');
        $purchaseOrder->update(['supplier_token_revoked_at'=>now()]);
        $this->audit->record('purchase_order.supplier_link_revoked',$purchaseOrder);
        return response()->noContent();
    }

    private function detail(PurchaseOrder $order): PurchaseOrder{return $order->fresh()->load(['purchaseRequest:id,reference,title,service,cost_center','supplier:id,legal_name,email,phone,address,city,country,niu,rccm','creator:id,name,email','items','approvals.decisionMaker:id,name,email']);}
    private function assertTenant(PurchaseOrder $order): void{abort_unless((int)$order->tenant_id===(int)app('tenant.id'),404);}
}
