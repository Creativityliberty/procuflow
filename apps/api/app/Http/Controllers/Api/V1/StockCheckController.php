<?php
namespace App\Http\Controllers\Api\V1;
use App\Http\Requests\StoreStockCheckRequest;
use App\Models\PurchaseRequest;
use App\Models\StockCheck;
use App\Services\AuditService;
use Illuminate\Support\Facades\DB;
class StockCheckController
{
    public function __construct(private readonly AuditService $audit) {}
    public function show(PurchaseRequest $purchaseRequest) {
        $this->assertTenant($purchaseRequest);
        return $purchaseRequest->stockCheck?->load(['items.purchaseRequestItem','checker:id,name,email']) ?? response()->json(['message'=>'Aucun controle de stock enregistre.'], 404);
    }
    public function store(StoreStockCheckRequest $request, PurchaseRequest $purchaseRequest) {
        $this->assertTenant($purchaseRequest);
        abort_unless(in_array($purchaseRequest->status, ['approved','in_consultation'], true), 422, 'La demande doit etre approuvee avant le controle de stock.');
        abort_if($purchaseRequest->rfq?->status === 'published', 422, 'Le controle est verrouille apres publication.');
        $sources = $purchaseRequest->items()->get()->keyBy('id');
        $submitted = collect($request->validated('items'));
        abort_unless($submitted->pluck('purchase_request_item_id')->sort()->values()->all() === $sources->keys()->sort()->values()->all(), 422, 'Toutes les lignes doivent etre controlees.');
        $rows = $submitted->map(function (array $row) use ($sources): array {
            $requested = (float) $sources->get($row['purchase_request_item_id'])->quantity;
            $available = $row['is_stock_item'] ? min($requested, (float) $row['available_quantity']) : 0;
            $buy = $row['is_stock_item'] ? max(0, $requested - $available) : $requested;
            return [...$row, 'requested_quantity'=>$requested, 'available_quantity'=>$available, 'procurement_quantity'=>$buy, 'result'=>!$row['is_stock_item']?'not_applicable':($buy==0?'available':($available>0?'partially_available':'unavailable'))];
        });
        $buy = $rows->sum('procurement_quantity');
        $result = $buy == 0 ? 'available' : ($rows->where('available_quantity','>',0)->isNotEmpty() ? 'partially_available' : ($rows->every(fn ($r) => $r['result']==='not_applicable') ? 'not_applicable' : 'unavailable'));
        $check = DB::transaction(function () use ($request,$purchaseRequest,$rows,$result): StockCheck {
            $check = StockCheck::query()->updateOrCreate(['purchase_request_id'=>$purchaseRequest->id], ['tenant_id'=>app('tenant.id'),'checked_by'=>$request->user()->id,'result'=>$result,'notes'=>$request->validated('notes'),'checked_at'=>now()]);
            $check->items()->delete(); $check->items()->createMany($rows->all()); return $check;
        });
        $this->audit->record('stock_check.completed', $purchaseRequest, ['result'=>$result]);
        return response()->json($check->load(['items.purchaseRequestItem','checker:id,name,email']), 201);
    }
    private function assertTenant(PurchaseRequest $request): void { abort_unless((int)$request->tenant_id === (int)app('tenant.id'), 404); }
}
