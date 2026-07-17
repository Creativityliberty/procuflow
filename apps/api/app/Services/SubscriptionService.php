<?php

namespace App\Services;

use App\Models\ContractDocument;
use App\Models\AcdeDocument;
use App\Models\Invoice;
use App\Models\InformationRequestDocument;
use App\Models\InformationRequestSupplier;
use App\Models\PurchaseRequestDocument;
use App\Models\SubscriptionPayment;
use App\Models\Supplier;
use App\Models\SupplierDocument;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\TenantSubscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SubscriptionService
{
    public function __construct(private readonly DohonePaymentService $dohone)
    {
    }

    public function detail(Tenant $tenant): array
    {
        $subscription = $this->subscription($tenant);
        $plan = config("plans.catalog.{$subscription->plan_code}");
        $usage = [
            'users' => $tenant->users()->count(),
            'suppliers' => Supplier::query()->where('tenant_id', $tenant->id)->count(),
            'storage_bytes' => (int) SupplierDocument::query()->where('tenant_id', $tenant->id)->sum('size_bytes')
                + (int) Invoice::query()->where('tenant_id', $tenant->id)->sum('size_bytes')
                + (int) ContractDocument::query()->whereHas('contract', fn ($query) => $query->where('tenant_id', $tenant->id))->sum('size_bytes')
                + (int) AcdeDocument::query()->whereHas('need', fn ($query) => $query->where('tenant_id', $tenant->id))->sum('size_bytes')
                + (int) PurchaseRequestDocument::query()->whereHas('purchaseRequest', fn ($query) => $query->where('tenant_id', $tenant->id))->sum('size_bytes')
                + (int) InformationRequestDocument::query()->whereHas('informationRequest', fn ($query) => $query->where('tenant_id', $tenant->id))->sum('size_bytes')
                + (int) InformationRequestSupplier::query()->whereHas('informationRequest', fn ($query) => $query->where('tenant_id', $tenant->id))->sum('response_size_bytes'),
        ];

        return ['subscription' => $subscription, 'plan' => ['code' => $subscription->plan_code, ...$plan], 'usage' => $usage, 'plans' => $this->catalog()];
    }

    public function catalog(): array
    {
        return collect(config('plans.catalog'))->map(fn ($plan, $code) => ['code' => $code, ...$plan])->values()->all();
    }

    public function subscription(Tenant $tenant): TenantSubscription
    {
        $subscription = TenantSubscription::query()->firstOrCreate(['tenant_id' => $tenant->id], [
            'plan_code' => config('plans.default', 'growth'), 'status' => 'trial', 'billing_cycle' => 'monthly',
            'trial_ends_at' => now()->addDays((int) config('plans.trial_days', 14)), 'current_period_starts_at' => now(), 'current_period_ends_at' => now()->addDays((int) config('plans.trial_days', 14)),
        ]);
        if ($subscription->status === 'trial' && $subscription->trial_ends_at?->isPast()) $subscription->update(['status' => 'expired']);
        if ($subscription->status === 'active' && $subscription->current_period_ends_at?->isPast()) $subscription->update(['status' => $subscription->cancel_at_period_end ? 'cancelled' : 'expired', 'cancelled_at' => $subscription->cancel_at_period_end ? now() : null]);
        return $subscription->fresh();
    }

    public function assertWithinLimit(Tenant $tenant, string $resource): void
    {
        $subscription = $this->subscription($tenant);
        abort_if(in_array($subscription->status, ['expired', 'cancelled'], true), 402, 'Votre abonnement doit etre renouvele pour continuer.');
        $limit = config("plans.catalog.{$subscription->plan_code}.limits.{$resource}");
        if ($limit === null) return;
        $count = $resource === 'users'
            ? $tenant->users()->count() + TenantInvitation::query()
                ->where('tenant_id', $tenant->id)
                ->whereNull('accepted_at')
                ->whereNull('revoked_at')
                ->where('expires_at', '>', now())
                ->count()
            : Supplier::query()->where('tenant_id', $tenant->id)->count();
        abort_if($count >= (int) $limit, 422, 'La limite de votre forfait est atteinte. Passez au forfait superieur.');
    }

    public function checkout(Tenant $tenant, array $data): array
    {
        $notifyUrl = route('subscriptions.dohone.notify');
        $this->dohone->assertConfiguration($notifyUrl);
        $plan = config("plans.catalog.{$data['plan_code']}");
        abort_unless($plan, 422, 'Forfait inconnu.');
        $priceKey = $data['billing_cycle'] === 'yearly' ? 'yearly_price' : 'monthly_price';
        $amount = (int) $plan[$priceKey];
        $reference = 'SUB-'.$tenant->id.'-'.now()->format('YmdHis').'-'.strtoupper(Str::random(5));
        $payment = SubscriptionPayment::query()->create(['tenant_id' => $tenant->id, 'reference' => $reference, 'plan_code' => $data['plan_code'], 'billing_cycle' => $data['billing_cycle'], 'amount' => $amount, 'currency' => 'XAF', 'payer_phone' => $data['phone'], 'payer_email' => $data['email'] ?? null]);
        $payload = $this->dohone->buildPaymentPayload(['reference' => $reference, 'amount' => $amount, 'currency' => 'XAF', 'phone' => $data['phone'], 'name' => $data['name'] ?? $tenant->name, 'email' => $data['email'] ?? null, 'motif' => "Abonnement ProcuFlow - {$plan['name']}", 'notify_page' => $notifyUrl]);
        return ['payment' => $payment->only(['id', 'reference', 'plan_code', 'billing_cycle', 'amount', 'currency', 'status']), 'payment_url' => config('services.dohone.payment_url'), 'payload' => $payload];
    }

    public function confirm(array $query): array
    {
        abort_unless(filled(config('services.dohone.merchant_code')) && filled(config('services.dohone.hash_code')), 503, 'Le paiement DOHONE n est pas configure.');
        abort_unless($this->dohone->verifyNotification($query), 403, 'Signature DOHONE invalide.');
        abort_unless(hash_equals((string) config('services.dohone.merchant_code'), (string) ($query['rH'] ?? '')), 403, 'Code marchand invalide.');
        $payment = SubscriptionPayment::query()->where('reference', $query['rI'] ?? '')->firstOrFail();
        abort_unless((string) $payment->amount === (string) ($query['rMt'] ?? ''), 422, 'Montant de paiement incorrect.');
        abort_unless($payment->currency === ($query['rDvs'] ?? 'XAF'), 422, 'Devise de paiement incorrecte.');
        abort_unless(! empty($query['idReqDoh']), 422, 'Reference DOHONE manquante.');
        if ($payment->status === 'paid') {
            abort_unless(hash_equals((string) $payment->dohone_request_id, (string) $query['idReqDoh']), 409, 'Cette reference est deja liee a une autre transaction DOHONE.');
            return ['payment' => $payment, 'idempotent' => true];
        }
        abort_if(SubscriptionPayment::query()->where('dohone_request_id', $query['idReqDoh'])->where('id', '!=', $payment->id)->exists(), 409, 'Transaction DOHONE deja utilisee.');

        $result = DB::transaction(function () use ($payment, $query): array {
            $locked = SubscriptionPayment::query()->lockForUpdate()->findOrFail($payment->id);
            if ($locked->status === 'paid') return ['subscription' => TenantSubscription::query()->where('tenant_id', $locked->tenant_id)->first(), 'idempotent' => true];
            $locked->update(['status' => 'paid', 'dohone_request_id' => $query['idReqDoh'], 'notification_payload' => collect($query)->only(['rI', 'rMt', 'rDvs', 'idReqDoh', 'rH', 'mode', 'motif'])->all(), 'paid_at' => now()]);
            $end = $locked->billing_cycle === 'yearly' ? now()->addYear() : now()->addMonth();
            $subscription = TenantSubscription::query()->updateOrCreate(['tenant_id' => $locked->tenant_id], ['plan_code' => $locked->plan_code, 'status' => 'active', 'billing_cycle' => $locked->billing_cycle, 'current_period_starts_at' => now(), 'current_period_ends_at' => $end, 'cancel_at_period_end' => false, 'cancelled_at' => null]);
            return ['subscription' => $subscription, 'idempotent' => false];
        });
        return ['payment' => $payment->fresh(), 'subscription' => $result['subscription'], 'idempotent' => $result['idempotent']];
    }
}
