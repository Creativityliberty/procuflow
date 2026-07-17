<?php

namespace Tests\Feature;

use App\Models\SubscriptionPayment;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubscriptionWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_dohone_notification_is_verified_and_idempotent(): void
    {
        config(['services.dohone.merchant_code' => 'MERCHANT-TEST', 'services.dohone.hash_code' => 'secret-hash']);
        $tenant = Tenant::query()->create(['name' => 'Alpha', 'slug' => 'alpha-subscription']);
        SubscriptionPayment::query()->create([
            'tenant_id' => $tenant->id, 'reference' => 'SUB-ALPHA-001', 'plan_code' => 'growth',
            'billing_cycle' => 'monthly', 'amount' => 75000, 'currency' => 'XAF', 'payer_phone' => '699000000',
        ]);
        $query = ['idReqDoh' => 'DOHONE-10001', 'rI' => 'SUB-ALPHA-001', 'rMt' => '75000', 'rDvs' => 'XAF', 'rH' => 'MERCHANT-TEST', 'mode' => 'MOMO'];
        $query['hash'] = md5($query['idReqDoh'].$query['rI'].$query['rMt'].'secret-hash');

        $this->getJson('/api/v1/subscriptions/dohone/notify?'.http_build_query($query))
            ->assertOk()->assertJsonPath('verified', true)->assertJsonPath('idempotent', false);
        $this->getJson('/api/v1/subscriptions/dohone/notify?'.http_build_query($query))
            ->assertOk()->assertJsonPath('idempotent', true);

        $this->assertDatabaseHas('subscription_payments', ['reference' => 'SUB-ALPHA-001', 'status' => 'paid', 'dohone_request_id' => 'DOHONE-10001']);
        $this->assertDatabaseHas('tenant_subscriptions', ['tenant_id' => $tenant->id, 'plan_code' => 'growth', 'status' => 'active']);
        $this->assertDatabaseHas('payment_notification_logs', ['reference' => 'SUB-ALPHA-001', 'status' => 'accepted']);
        $this->assertDatabaseHas('payment_notification_logs', ['reference' => 'SUB-ALPHA-001', 'status' => 'replayed']);
    }

    public function test_starter_user_quota_counts_pending_invitations(): void
    {
        $tenant = Tenant::query()->create(['name' => 'Beta', 'slug' => 'beta-quota']);
        $owner = User::query()->create(['name' => 'Owner', 'email' => 'owner-quota@test.dev', 'password' => 'password', 'current_tenant_id' => $tenant->id]);
        $tenant->users()->attach($owner, ['role' => 'owner']);
        $tenant->subscription()->create(['plan_code' => 'starter', 'status' => 'active', 'billing_cycle' => 'monthly', 'current_period_starts_at' => now(), 'current_period_ends_at' => now()->addMonth()]);
        Sanctum::actingAs($owner);
        $headers = ['X-Tenant-ID' => (string) $tenant->id];

        $this->withHeaders($headers)->postJson('/api/v1/team/invitations', ['email' => 'one@test.dev', 'role' => 'buyer'])->assertCreated();
        $this->withHeaders($headers)->postJson('/api/v1/team/invitations', ['email' => 'two@test.dev', 'role' => 'buyer'])->assertCreated();
        $this->withHeaders($headers)->postJson('/api/v1/team/invitations', ['email' => 'three@test.dev', 'role' => 'buyer'])->assertUnprocessable();
    }

    public function test_an_invalid_dohone_notification_is_rejected_and_logged(): void
    {
        config(['services.dohone.merchant_code' => 'MERCHANT-TEST', 'services.dohone.hash_code' => 'secret-hash']);
        $tenant = Tenant::query()->create(['name' => 'Gamma', 'slug' => 'gamma-subscription']);
        SubscriptionPayment::query()->create([
            'tenant_id' => $tenant->id, 'reference' => 'SUB-GAMMA-001', 'plan_code' => 'growth',
            'billing_cycle' => 'monthly', 'amount' => 75000, 'currency' => 'XAF', 'payer_phone' => '699000001',
        ]);

        $this->getJson('/api/v1/subscriptions/dohone/notify?'.http_build_query([
            'idReqDoh' => 'DOHONE-INVALID', 'rI' => 'SUB-GAMMA-001', 'rMt' => '75000',
            'rDvs' => 'XAF', 'rH' => 'MERCHANT-TEST', 'mode' => 'MOMO', 'hash' => 'incorrect',
        ]))->assertForbidden();

        $this->assertDatabaseHas('subscription_payments', ['reference' => 'SUB-GAMMA-001', 'status' => 'pending']);
        $this->assertDatabaseHas('payment_notification_logs', ['reference' => 'SUB-GAMMA-001', 'status' => 'rejected']);
    }
}
