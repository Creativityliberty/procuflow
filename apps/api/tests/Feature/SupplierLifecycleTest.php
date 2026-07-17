<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupplierLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_supplier_can_be_evaluated_submitted_and_approved(): void
    {
        $tenant = Tenant::query()->create(['name' => 'Alpha', 'slug' => 'alpha']);
        $owner = User::query()->create([
            'name' => 'Alpha Owner',
            'email' => 'owner@alpha.test',
            'password' => 'Procuflow2026',
            'current_tenant_id' => $tenant->id,
        ]);
        $tenant->users()->attach($owner, ['role' => 'owner']);
        $supplier = Supplier::query()->create([
            'tenant_id' => $tenant->id,
            'legal_name' => 'Fournisseur Alpha',
            'status' => 'draft',
        ]);
        Sanctum::actingAs($owner);
        $headers = ['X-Tenant-ID' => (string) $tenant->id];

        $this->withHeaders($headers)->postJson("/api/v1/suppliers/{$supplier->id}/evaluations", [
            'credit_score' => 4,
            'payment_terms_score' => 5,
            'proximity_score' => 4,
            'support_score' => 3,
            'warranty_score' => 5,
            'value_score' => 4,
            'comment' => 'Dossier satisfaisant.',
        ])->assertCreated()->assertJsonPath('score', '4.17');

        $this->withHeaders($headers)->postJson("/api/v1/suppliers/{$supplier->id}/submit")
            ->assertOk()
            ->assertJsonPath('status', 'pending');
        $this->withHeaders($headers)->postJson("/api/v1/suppliers/{$supplier->id}/approve")
            ->assertOk()
            ->assertJsonPath('status', 'active');

        $this->assertDatabaseHas('suppliers', ['id' => $supplier->id, 'status' => 'active', 'score' => 4.17]);
        $this->assertDatabaseCount('supplier_status_histories', 2);
        $this->assertDatabaseHas('audit_logs', ['action' => 'supplier.evaluated']);
    }
}
