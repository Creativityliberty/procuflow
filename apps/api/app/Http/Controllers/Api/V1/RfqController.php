<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\StoreRfqRequest;
use App\Models\ProcurementException;
use App\Models\PurchaseRequest;
use App\Models\Rfq;
use App\Models\RfqSupplier;
use App\Models\Supplier;
use App\Services\AuditService;
use App\Services\ProcurementPolicyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RfqController
{
    public function __construct(private readonly ProcurementPolicyService $policies, private readonly AuditService $audit) {}

    public function index(Request $request)
    {
        return Rfq::query()->where('tenant_id', app('tenant.id'))
            ->when($request->string('status')->toString(), fn ($q,$status) => $q->where('status',$status))
            ->when($request->string('search')->toString(), fn ($q,$search) => $q->where(fn ($n) => $n->where('reference','like',"%{$search}%")->orWhere('title','like',"%{$search}%")))
            ->with('purchaseRequest:id,reference,title,estimated_amount,currency')
            ->withCount(['invitedSuppliers','invitedSuppliers as submitted_offers_count'=>fn ($q) => $q->where('status','submitted')])
            ->latest('id')->paginate(20);
    }

    public function store(StoreRfqRequest $request)
    {
        $data = $request->validated();
        $purchase = PurchaseRequest::query()->where('tenant_id',app('tenant.id'))->with(['items','stockCheck.items','sourceNeed.items'])->findOrFail($data['purchase_request_id']);
        abort_unless($purchase->status === 'approved', 422, 'Seule une demande approuvee peut etre consultee.');
        abort_if(Rfq::query()->where('tenant_id',app('tenant.id'))->where('purchase_request_id',$purchase->id)->where('status','!=','cancelled')->exists(), 422, 'Une consultation existe deja pour cette demande.');
        abort_unless($purchase->stockCheck, 422, 'Le controle de stock est obligatoire avant la consultation.');
        $stock = $purchase->stockCheck->items->keyBy('purchase_request_item_id');
        $items = $purchase->items->filter(fn ($item) => (float)($stock->get($item->id)?->procurement_quantity ?? 0) > 0);
        abort_if($items->isEmpty(), 422, 'Tout est disponible en stock. Aucune consultation n est necessaire.');
        $amount = (int)round($items->sum(fn ($item) => (float)$stock->get($item->id)->procurement_quantity * (int)$item->estimated_unit_price));
        $tier = $this->policies->tierFor((int)app('tenant.id'), $amount);
        $suppliers = Supplier::query()->where('tenant_id',app('tenant.id'))->where('status','active')->whereIn('id',$data['supplier_ids'])->get();
        abort_unless($suppliers->count() === count($data['supplier_ids']), 422, 'Tous les fournisseurs doivent etre actifs.');
        $tokens = [];
        $rfq = DB::transaction(function () use ($request,$data,$purchase,$items,$stock,$tier,$suppliers,&$tokens): Rfq {
            $rfq = Rfq::query()->create(['tenant_id'=>app('tenant.id'),'purchase_request_id'=>$purchase->id,'created_by'=>$request->user()->id,'reference'=>'TEMP-'.Str::uuid(),'title'=>$data['title'],'description'=>$data['description']??null,'currency'=>$data['currency']??$purchase->currency,'response_deadline'=>$data['response_deadline'],'delivery_location'=>$data['delivery_location']??null,'payment_terms'=>$data['payment_terms']??null,'status'=>'draft','required_quote_count'=>$tier->required_quotes,'competition_method'=>$tier->competition_method]);
            $rfq->update(['reference'=>sprintf('RFQ-%s-%06d',now()->format('Y'),$rfq->id)]);
            foreach ($items->values() as $position=>$item) $rfq->items()->create(['purchase_request_item_id'=>$item->id,'description'=>$item->description,'quantity'=>$stock->get($item->id)->procurement_quantity,'unit'=>$item->unit,'specifications'=>$item->specifications,'position'=>$position]);
            foreach (($purchase->sourceNeed?->items ?? collect())->values() as $position => $item) {
                $rfq->requirements()->create([
                    'acde_item_id'=>$item->id,'kind'=>$item->kind,'priority_level'=>$item->priority_level,
                    'content'=>$item->content,'criterion'=>$item->criterion,'target_value'=>$item->target_value,
                    'unit'=>$item->unit,'tolerance'=>$item->tolerance,'verification_method'=>$item->verification_method,'position'=>$position,
                ]);
            }
            foreach ($suppliers as $supplier) { $token=Str::random(64); $rfq->invitedSuppliers()->create(['supplier_id'=>$supplier->id,'contact_email'=>$supplier->email,'access_token_hash'=>hash('sha256',$token),'token_last_four'=>substr($token,-4),'token_expires_at'=>$rfq->response_deadline]); $tokens[$supplier->id]=$token; }
            return $rfq;
        });
        $this->audit->record('rfq.created',$rfq,['required_quotes'=>$rfq->required_quote_count]);
        return response()->json([...$this->detail($rfq)->toArray(),'portal_links'=>$this->links($rfq,$tokens)],201);
    }

    public function show(Rfq $rfq) { $this->assertTenant($rfq); return $this->detail($rfq); }

    public function publish(Rfq $rfq)
    {
        $this->assertTenant($rfq); abort_unless($rfq->status==='draft',422,'Seul un brouillon peut etre publie.');
        abort_if($rfq->invitedSuppliers()->count() < $rfq->required_quote_count && !$rfq->exception()->where('status','approved')->exists(),422,'Invitez le nombre minimum de fournisseurs ou faites approuver une derogation.');
        $tokens=[];
        DB::transaction(function () use ($rfq,&$tokens): void { foreach($rfq->invitedSuppliers as $invite){$token=Str::random(64);$invite->update(['access_token_hash'=>hash('sha256',$token),'token_last_four'=>substr($token,-4),'token_expires_at'=>$rfq->response_deadline,'token_revoked_at'=>null,'status'=>'invited','invited_at'=>now()]);$tokens[$invite->supplier_id]=$token;} $rfq->update(['status'=>'published','published_at'=>now()]);$rfq->purchaseRequest()->update(['status'=>'in_consultation']); });
        $this->audit->record('rfq.published',$rfq,['invitations'=>count($tokens)]);
        return [...$this->detail($rfq)->toArray(),'portal_links'=>$this->links($rfq,$tokens)];
    }

    public function close(Rfq $rfq)
    {
        $this->assertTenant($rfq); abort_unless($rfq->status==='published',422,'Seule une consultation publiee peut etre cloturee.');
        $count=$rfq->invitedSuppliers()->where('status','submitted')->count();
        abort_if($count<$rfq->required_quote_count && !$rfq->exception()->where('status','approved')->exists(),422,"{$rfq->required_quote_count} offres sont requises avant la cloture.");
        $rfq->update(['status'=>'closed','closed_at'=>now()]); $this->audit->record('rfq.closed',$rfq,['submitted_offers'=>$count]); return $this->detail($rfq);
    }

    public function regenerateLink(Rfq $rfq, RfqSupplier $invitation)
    {
        $this->assertTenant($rfq); abort_unless((int)$invitation->rfq_id===(int)$rfq->id,404); abort_unless(in_array($rfq->status,['draft','published'],true),422);
        $token=Str::random(64);$invitation->update(['access_token_hash'=>hash('sha256',$token),'token_last_four'=>substr($token,-4),'token_expires_at'=>$rfq->response_deadline,'token_revoked_at'=>null,'invited_at'=>$rfq->status==='published'?now():$invitation->invited_at]);
        $this->audit->record('rfq.invitation_link_regenerated',$rfq,['supplier_id'=>$invitation->supplier_id]); return ['url'=>$this->portalUrl($token),'email'=>$invitation->contact_email];
    }

    public function revokeLink(Rfq $rfq, RfqSupplier $invitation)
    {
        $this->assertTenant($rfq);abort_unless((int)$invitation->rfq_id===(int)$rfq->id,404);
        $invitation->update(['token_revoked_at'=>now()]);
        $this->audit->record('rfq.invitation_link_revoked',$rfq,['supplier_id'=>$invitation->supplier_id]);
        return response()->noContent();
    }

    public function requestException(Request $request,Rfq $rfq)
    {
        $this->assertTenant($rfq);$data=$request->validate(['type'=>['required',Rule::in(['urgency','sole_source','recent_contract'])],'justification'=>['required','string','min:20','max:5000'],'evidence_reference'=>['nullable','string','max:255']]);
        $exception=ProcurementException::query()->updateOrCreate(['rfq_id'=>$rfq->id],[...$data,'tenant_id'=>app('tenant.id'),'requested_by'=>$request->user()->id,'status'=>'pending','decided_by'=>null,'decided_at'=>null]);$this->audit->record('rfq.exception_requested',$rfq);return response()->json($exception,201);
    }

    public function decideException(Request $request,Rfq $rfq)
    {
        $this->assertTenant($rfq);abort_unless(in_array($request->user()->roleForTenant(app('tenant.id')),['owner','admin','director'],true),403);$data=$request->validate(['decision'=>['required',Rule::in(['approved','rejected'])],'comment'=>['nullable','string','max:3000']]);$exception=$rfq->exception()->firstOrFail();abort_unless($exception->status==='pending',422);$exception->update(['status'=>$data['decision'],'decision_comment'=>$data['comment']??null,'decided_by'=>$request->user()->id,'decided_at'=>now()]);$this->audit->record('rfq.exception_'.$data['decision'],$rfq);return $exception;
    }

    public function message(Request $request,Rfq $rfq)
    {
        $this->assertTenant($rfq);$data=$request->validate(['rfq_supplier_id'=>['nullable','integer'],'body'=>['required','string','max:5000']]);if(!empty($data['rfq_supplier_id']))abort_unless($rfq->invitedSuppliers()->whereKey($data['rfq_supplier_id'])->exists(),422);$message=$rfq->messages()->create([...$data,'user_id'=>$request->user()->id,'sender_type'=>'buyer']);$this->audit->record('rfq.message_sent',$rfq);return response()->json($message,201);
    }

    private function detail(Rfq $rfq): Rfq { return $rfq->fresh()->load(['purchaseRequest.items','purchaseRequest.stockCheck.items','creator:id,name,email','items','requirements','invitedSuppliers.supplier:id,legal_name,email,category,city,status,score','invitedSuppliers.offer.items','invitedSuppliers.offer.requirementResponses.requirement','invitedSuppliers.offer.versions','comparison:id,rfq_id,status,recommended_offer_id','exception','messages']); }
    private function links(Rfq $rfq,array $tokens): array { return $rfq->invitedSuppliers->map(fn($invite)=>['supplier_id'=>$invite->supplier_id,'email'=>$invite->contact_email,'url'=>$this->portalUrl($tokens[$invite->supplier_id])])->values()->all(); }
    private function portalUrl(string $token): string { return rtrim((string)config('app.frontend_url'),'/').'/supplier-portal/rfqs/'.$token; }
    private function assertTenant(Rfq $rfq): void { abort_unless((int)$rfq->tenant_id===(int)app('tenant.id'),404); }
}
