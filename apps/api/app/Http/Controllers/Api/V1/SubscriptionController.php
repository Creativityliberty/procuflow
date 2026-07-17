<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\PaymentNotificationLog;
use App\Models\SubscriptionPayment;
use App\Models\Tenant;
use App\Services\AuditService;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class SubscriptionController
{
    public function __construct(private readonly SubscriptionService $subscriptions, private readonly AuditService $audit) {}

    public function show()
    {
        return response()->json($this->subscriptions->detail(Tenant::query()->findOrFail(app('tenant.id'))));
    }

    public function checkout(Request $request)
    {
        $this->owner($request);
        $data = $request->validate(['plan_code' => ['required', Rule::in(array_keys(config('plans.catalog')))], 'billing_cycle' => ['required', Rule::in(['monthly', 'yearly'])], 'phone' => ['required', 'string', 'regex:/^[0-9+ ]{8,20}$/'], 'name' => ['nullable', 'string', 'max:120'], 'email' => ['nullable', 'email']]);
        $result = $this->subscriptions->checkout(Tenant::query()->findOrFail(app('tenant.id')), $data);
        $payment = SubscriptionPayment::query()->where('reference', $result['payment']['reference'])->first();
        $this->audit->record('subscription.checkout_started', $payment, ['plan' => $data['plan_code']]);
        return response()->json($result, 201);
    }

    public function payments(Request $request)
    {
        $this->owner($request);
        return SubscriptionPayment::query()->where('tenant_id', app('tenant.id'))->select('id', 'reference', 'plan_code', 'billing_cycle', 'amount', 'currency', 'status', 'paid_at', 'created_at')->latest('id')->limit(12)->get();
    }

    public function cancel(Request $request)
    {
        $this->owner($request);$subscription=$this->subscriptions->subscription(Tenant::query()->findOrFail(app('tenant.id')));abort_unless(in_array($subscription->status,['trial','active'],true),422,'Cet abonnement ne peut pas etre resilie.');$subscription->update(['cancel_at_period_end'=>true]);$this->audit->record('subscription.cancellation_scheduled',$subscription);return $subscription;
    }

    public function resume(Request $request)
    {
        $this->owner($request);$subscription=$this->subscriptions->subscription(Tenant::query()->findOrFail(app('tenant.id')));abort_unless($subscription->cancel_at_period_end,422);$subscription->update(['cancel_at_period_end'=>false,'cancelled_at'=>null]);$this->audit->record('subscription.resumed',$subscription);return $subscription;
    }

    public function notify(Request $request)
    {
        $query = $request->query();
        $reference = is_scalar($query['rI'] ?? null) ? (string) $query['rI'] : null;
        $payment = $reference ? SubscriptionPayment::query()->where('reference', $reference)->first() : null;
        try {
            $result = $this->subscriptions->confirm($query);
            $payment = $result['payment'];
            app()->instance('tenant.id', $payment->tenant_id);
            $this->logNotification($request, $payment, $result['idempotent'] ? 'replayed' : 'accepted');
            $this->audit->record('subscription.payment_confirmed', $payment, ['dohone_request_id' => $payment->dohone_request_id, 'idempotent' => $result['idempotent']]);
            return response()->json(['verified' => true, 'status' => 'accepted', 'idempotent' => $result['idempotent']]);
        } catch (Throwable $exception) {
            $status = $exception instanceof HttpExceptionInterface ? $exception->getStatusCode() : 500;
            $this->logNotification($request, $payment, 'rejected', "HTTP {$status}: ".mb_substr($exception->getMessage() ?: 'Notification invalide', 0, 220));
            throw $exception;
        }
    }

    private function logNotification(Request $request, ?SubscriptionPayment $payment, string $status, ?string $reason = null): void
    {
        $query = $request->query();
        PaymentNotificationLog::query()->create([
            'tenant_id' => $payment?->tenant_id,
            'subscription_payment_id' => $payment?->id,
            'reference' => is_scalar($query['rI'] ?? null) ? (string) $query['rI'] : null,
            'provider_request_id' => is_scalar($query['idReqDoh'] ?? null) ? (string) $query['idReqDoh'] : null,
            'status' => $status,
            'reason' => $reason,
            'payload' => collect($query)->only(['rI', 'rMt', 'rDvs', 'idReqDoh', 'rH', 'mode', 'motif'])->map(fn ($value) => is_scalar($value) ? (string) $value : '[invalid]')->all(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'received_at' => now(),
        ]);
    }

    private function owner(Request $request): void
    {
        abort_unless(in_array($request->user()->roleForTenant(app('tenant.id')), ['owner', 'admin'], true), 403, 'Seul un administrateur peut gerer l abonnement.');
    }
}
