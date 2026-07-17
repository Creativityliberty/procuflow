<?php

namespace App\Services;

use App\Models\Delivery;
use App\Models\AppNotification;
use App\Models\AutomationSetting;
use App\Models\Invoice;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\ReportSnapshot;
use App\Models\Supplier;
use App\Models\Tenant;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Mail;

class ReportingService
{
    public function overview(int $tenantId, CarbonInterface $from, CarbonInterface $to): array
    {
        $requests = PurchaseRequest::query()->where('tenant_id', $tenantId)->whereBetween('created_at', [$from, $to])->get();
        $currency = $this->currency($tenantId);
        $orders = PurchaseOrder::query()->where('tenant_id', $tenantId)->where('currency', $currency)->whereBetween('created_at', [$from, $to])->with('purchaseRequest:id,estimated_amount')->get();
        $invoices = Invoice::query()->where('tenant_id', $tenantId)->where('currency', $currency)->whereBetween('created_at', [$from, $to])->get();
        $deliveries = Delivery::query()->where('tenant_id', $tenantId)->whereBetween('created_at', [$from, $to])->with('receipts')->get();
        $eligibleOrders = $orders->whereNotIn('status', ['cancelled', 'refused']);
        $processedRequests = $requests->filter(fn ($row) => $row->submitted_at && $row->approved_at);
        $processedOrders = $orders->filter(fn ($row) => $row->submitted_at && $row->validated_at);
        $submittedRequests = $requests->where('status', '!=', 'draft');
        $completedDeliveries = $deliveries->where('status', 'complete')->filter(fn ($row) => $row->planned_at && $row->receipts->isNotEmpty());
        $onTimeDeliveries = $completedDeliveries->filter(function ($delivery): bool {
            $lastReceipt = $delivery->receipts->sortByDesc('received_at')->first()?->received_at;
            return $lastReceipt !== null && $lastReceipt->lessThanOrEqualTo($delivery->planned_at);
        });
        $savings = $eligibleOrders->sum(function ($order): int {
            $estimate = (int) ($order->purchaseRequest?->estimated_amount ?? 0);
            return max(0, $estimate - (int) $order->total_amount);
        });

        return [
            'period' => $this->period($from, $to),
            'currency' => $currency,
            'metrics' => [
                'order_count' => $orders->count(),
                'purchase_volume' => (int) $eligibleOrders->sum('total_amount'),
                'committed_amount' => (int) $orders->whereIn('status', ['created', 'in_validation', 'validated', 'sent', 'accepted'])->sum('total_amount'),
                'realized_amount' => (int) $invoices->where('status', 'paid')->sum('total_amount'),
                'savings' => (int) $savings,
                'budget_variance' => (int) $eligibleOrders->sum(fn ($order) => (int) $order->total_amount - (int) ($order->purchaseRequest?->estimated_amount ?? 0)),
                'average_request_processing_days' => $this->averageDays($processedRequests, 'submitted_at', 'approved_at'),
                'average_order_processing_days' => $this->averageDays($processedOrders, 'submitted_at', 'validated_at'),
                'validation_rate' => $this->percentage($submittedRequests->whereIn('status', ['approved', 'in_consultation', 'supplier_selected', 'ordered'])->count(), $submittedRequests->count()),
                'on_time_delivery_rate' => $this->percentage($onTimeDeliveries->count(), $completedDeliveries->count()),
                'unreceived_orders' => $orders->where('status', 'accepted')->filter(fn ($order) => ! $deliveries->contains('purchase_order_id', $order->id) || $deliveries->firstWhere('purchase_order_id', $order->id)?->status !== 'complete')->count(),
                'cancelled_orders' => $orders->whereIn('status', ['cancelled', 'refused'])->count(),
            ],
            'monthly_spend' => $this->monthlySpend($eligibleOrders, $from, $to),
            'request_statuses' => $requests->groupBy('status')->map->count()->sortKeys()->map(fn ($count, $status) => ['status' => $status, 'count' => $count])->values()->all(),
            'generated_at' => now()->toIso8601String(),
        ];
    }

    public function budgetVariances(int $tenantId, CarbonInterface $from, CarbonInterface $to): array
    {
        $currency = $this->currency($tenantId);
        $orders = PurchaseOrder::query()->where('tenant_id', $tenantId)
            ->where('currency', $currency)
            ->whereBetween('created_at', [$from, $to])
            ->whereNotIn('status', ['cancelled', 'refused'])
            ->with(['purchaseRequest:id,reference,title,service,cost_center,estimated_amount,currency', 'supplier:id,legal_name'])
            ->get();
        $rows = $orders->map(function (PurchaseOrder $order): array {
            $budget = (int) ($order->purchaseRequest?->estimated_amount ?? 0);
            $actual = (int) $order->total_amount;
            $variance = $actual - $budget;
            $percentage = $budget > 0 ? round($variance / $budget * 100, 1) : 0;

            return [
                'purchase_order_id' => $order->id,
                'reference' => $order->reference,
                'request_reference' => $order->purchaseRequest?->reference,
                'title' => $order->purchaseRequest?->title,
                'service' => $order->purchaseRequest?->service,
                'cost_center' => $order->purchaseRequest?->cost_center,
                'supplier' => $order->supplier?->legal_name,
                'currency' => $order->currency,
                'budget_amount' => $budget,
                'actual_amount' => $actual,
                'variance_amount' => $variance,
                'variance_percent' => $percentage,
                'severity' => $percentage > 10 ? 'high' : ($percentage > 0 ? 'medium' : 'positive'),
            ];
        })->sortByDesc('variance_percent')->values();

        return [
            'period' => $this->period($from, $to),
            'currency' => $currency,
            'summary' => [
                'budget_total' => (int) $rows->sum('budget_amount'),
                'actual_total' => (int) $rows->sum('actual_amount'),
                'variance_total' => (int) $rows->sum('variance_amount'),
                'over_budget_count' => $rows->where('variance_amount', '>', 0)->count(),
            ],
            'rows' => $rows->all(),
            'generated_at' => now()->toIso8601String(),
        ];
    }

    public function supplierPerformance(int $tenantId, CarbonInterface $from, CarbonInterface $to): array
    {
        $currency = $this->currency($tenantId);
        $suppliers = Supplier::query()->where('tenant_id', $tenantId)->with([
            'purchaseOrders' => fn ($query) => $query->where('currency', $currency)->whereBetween('created_at', [$from, $to])->with(['delivery.receipts', 'invoices']),
        ])->get();
        $rows = $suppliers->map(function (Supplier $supplier): array {
            $orders = $supplier->purchaseOrders;
            $deliveries = $orders->pluck('delivery')->filter();
            $completed = $deliveries->where('status', 'complete');
            $late = $deliveries->filter(function ($delivery): bool {
                if (! $delivery->planned_at) return false;
                if ($delivery->status !== 'complete') return $delivery->planned_at->isPast();
                $lastReceipt = $delivery->receipts->sortByDesc('received_at')->first()?->received_at;
                return $lastReceipt !== null && $lastReceipt->greaterThan($delivery->planned_at);
            });
            $invoices = $orders->flatMap->invoices;
            $matched = $invoices->where('match_status', 'matched')->count();
            $onTimeRate = $this->percentage(max(0, $completed->count() - $late->where('status', 'complete')->count()), $completed->count());
            $conformityRate = $this->percentage($matched, $invoices->count());
            $score = (float) ($supplier->score ?? 0);
            $riskPoints = ($score > 0 && $score < 3 ? 2 : 0) + ($late->count() > 0 ? 2 : 0) + ($invoices->count() > 0 && $conformityRate < 85 ? 2 : 0) + ($deliveries->where('status', 'disputed')->count() > 0 ? 2 : 0);

            return [
                'supplier_id' => $supplier->id,
                'supplier' => $supplier->legal_name,
                'category' => $supplier->category,
                'score' => $score,
                'revenue' => (int) $invoices->where('status', 'paid')->sum('total_amount'),
                'order_count' => $orders->count(),
                'late_orders' => $late->count(),
                'cancelled_orders' => $orders->whereIn('status', ['cancelled', 'refused'])->count(),
                'average_lead_time_days' => $this->averageDeliveryDays($deliveries),
                'on_time_rate' => $onTimeRate,
                'conformity_rate' => $conformityRate,
                'disputes' => $deliveries->where('status', 'disputed')->count(),
                'risk_level' => $riskPoints >= 4 ? 'high' : ($riskPoints >= 2 ? 'medium' : 'low'),
            ];
        })->sortBy(fn ($row) => ['high' => 0, 'medium' => 1, 'low' => 2][$row['risk_level']])->values();

        return [
            'period' => $this->period($from, $to),
            'currency' => $currency,
            'summary' => [
                'supplier_count' => $rows->count(),
                'watched_count' => $rows->whereIn('risk_level', ['high', 'medium'])->count(),
                'high_risk_count' => $rows->where('risk_level', 'high')->count(),
                'average_score' => round((float) $rows->where('score', '>', 0)->avg('score'), 2),
            ],
            'rows' => $rows->all(),
            'generated_at' => now()->toIso8601String(),
        ];
    }

    public function snapshot(int $tenantId, string $type, CarbonInterface $from, CarbonInterface $to, ?int $userId = null): ReportSnapshot
    {
        $payload = match ($type) {
            'budget' => $this->budgetVariances($tenantId, $from, $to),
            'suppliers' => $this->supplierPerformance($tenantId, $from, $to),
            default => $this->overview($tenantId, $from, $to),
        };

        return ReportSnapshot::query()->updateOrCreate(
            ['tenant_id' => $tenantId, 'report_type' => $type, 'period_start' => $from->toDateString(), 'period_end' => $to->toDateString()],
            ['frequency' => $type === 'suppliers' ? 'quarterly' : 'monthly', 'payload' => $payload, 'generated_by' => $userId, 'generated_at' => now()]
        );
    }

    public function distribute(ReportSnapshot $snapshot): int
    {
        if (! $snapshot->wasRecentlyCreated) return 0;
        $roles = match ($snapshot->report_type) {
            'budget' => ['owner', 'admin', 'finance', 'controller'],
            'suppliers' => ['owner', 'admin', 'procurement_manager', 'director'],
            default => ['owner', 'admin', 'procurement_manager', 'director'],
        };
        $title = match ($snapshot->report_type) {
            'budget' => 'Rapport des derives budgetaires disponible',
            'suppliers' => 'Synthese fournisseurs sous surveillance disponible',
            default => 'Tableau de bord Achats mensuel disponible',
        };
        $body = 'Periode du '.$snapshot->period_start->format('d/m/Y').' au '.$snapshot->period_end->format('d/m/Y').'.';
        $users = $snapshot->tenant->users()->wherePivotIn('role', $roles)->get();
        $settings = AutomationSetting::query()->firstOrCreate(['tenant_id' => $snapshot->tenant_id]);

        foreach ($users as $user) {
            if ($settings->in_app_enabled) AppNotification::query()->create(['tenant_id' => $snapshot->tenant_id, 'user_id' => $user->id, 'type' => 'report_ready', 'title' => $title, 'body' => $body, 'action_url' => '/reports']);
            if ($settings->email_enabled && $user->email) Mail::raw($title."\n\n".$body."\n\n".rtrim((string) config('app.frontend_url'), '/').'/reports', fn ($mail) => $mail->to($user->email)->subject('[ProcuFlow] '.$title));
        }

        return $users->count();
    }

    private function averageDays(Collection $rows, string $start, string $end): float
    {
        return round((float) $rows->avg(fn ($row) => $row->{$start}->floatDiffInDays($row->{$end})), 1);
    }

    private function averageDeliveryDays(Collection $deliveries): float
    {
        $completed = $deliveries->filter(fn ($row) => $row->confirmed_at && $row->receipts->isNotEmpty());
        return round((float) $completed->avg(fn ($row) => $row->confirmed_at->floatDiffInDays($row->receipts->sortByDesc('received_at')->first()->received_at)), 1);
    }

    private function percentage(int $part, int $total): float
    {
        return $total > 0 ? round($part / $total * 100, 1) : 0;
    }

    private function monthlySpend(Collection $orders, CarbonInterface $from, CarbonInterface $to): array
    {
        $cursor = $from->copy()->startOfMonth();
        $months = [];
        while ($cursor->lessThanOrEqualTo($to)) {
            $key = $cursor->format('Y-m');
            $months[$key] = ['month' => $key, 'label' => $cursor->translatedFormat('M Y'), 'amount' => 0];
            $cursor = $cursor->addMonth();
        }
        foreach ($orders as $order) {
            $key = $order->created_at->format('Y-m');
            if (isset($months[$key])) $months[$key]['amount'] += (int) $order->total_amount;
        }
        return array_values($months);
    }

    private function period(CarbonInterface $from, CarbonInterface $to): array
    {
        return ['from' => $from->toDateString(), 'to' => $to->toDateString()];
    }

    private function currency(int $tenantId): string
    {
        return (string) (Tenant::query()->whereKey($tenantId)->value('currency') ?: 'XAF');
    }
}
