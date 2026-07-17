<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_reporting_returns_a_complete_zero_state_for_a_new_company(): void
    {
        [$tenant, $owner] = $this->tenantUser('owner');
        Sanctum::actingAs($owner);

        $this->withHeader('X-Tenant-ID', (string) $tenant->id)
            ->getJson('/api/v1/reports/overview?from=2026-01-01&to=2026-03-31')
            ->assertOk()
            ->assertJsonPath('metrics.order_count', 0)
            ->assertJsonPath('metrics.purchase_volume', 0)
            ->assertJsonCount(3, 'monthly_spend');
    }

    public function test_authorized_user_can_archive_a_report_snapshot(): void
    {
        Mail::fake();
        [$tenant, $owner] = $this->tenantUser('owner');
        Sanctum::actingAs($owner);

        $this->withHeader('X-Tenant-ID', (string) $tenant->id)
            ->postJson('/api/v1/reports/generate', ['type' => 'overview', 'from' => '2026-01-01', 'to' => '2026-01-31'])
            ->assertCreated()
            ->assertJsonPath('report_type', 'overview');

        $this->assertDatabaseHas('report_snapshots', ['tenant_id' => $tenant->id, 'report_type' => 'overview', 'period_start' => '2026-01-01']);
    }

    public function test_requester_cannot_generate_an_official_snapshot(): void
    {
        [$tenant, $requester] = $this->tenantUser('requester');
        Sanctum::actingAs($requester);

        $this->withHeader('X-Tenant-ID', (string) $tenant->id)
            ->postJson('/api/v1/reports/generate', ['type' => 'budget', 'from' => '2026-01-01', 'to' => '2026-01-31'])
            ->assertForbidden();
    }

    public function test_csv_export_is_utf8_and_downloadable(): void
    {
        [$tenant, $owner] = $this->tenantUser('owner');
        Sanctum::actingAs($owner);

        $response = $this->withHeader('X-Tenant-ID', (string) $tenant->id)
            ->get('/api/v1/reports/export?type=overview&from=2026-01-01&to=2026-01-31');

        $response->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('Indicateur;Valeur', $response->streamedContent());
    }

    private function tenantUser(string $role): array
    {
        $tenant = Tenant::query()->create(['name' => 'Reporting SA', 'slug' => 'reporting-'.uniqid()]);
        $user = User::query()->create(['name' => ucfirst($role), 'email' => $role.'-'.uniqid().'@test.dev', 'password' => 'Procuflow2026', 'current_tenant_id' => $tenant->id]);
        $tenant->users()->attach($user, ['role' => $role]);
        return [$tenant, $user];
    }
}
