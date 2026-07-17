<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ContractWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_signed_contract_can_be_created_and_activated(): void
    {
        Storage::fake('local');
        $tenant = Tenant::query()->create(['name' => 'Alpha', 'slug' => 'alpha-contract']);
        $owner = User::query()->create(['name' => 'Owner', 'email' => 'owner-contract@test.dev', 'password' => 'password', 'current_tenant_id' => $tenant->id]);
        $tenant->users()->attach($owner, ['role' => 'owner']);
        $supplier = Supplier::query()->create(['tenant_id' => $tenant->id, 'legal_name' => 'Maintenance Plus', 'status' => 'active']);
        Sanctum::actingAs($owner);
        $headers = ['X-Tenant-ID' => (string) $tenant->id];

        $created = $this->withHeaders($headers)->postJson('/api/v1/contracts', [
            'supplier_id' => $supplier->id, 'owner_user_id' => $owner->id, 'reference' => 'ctr-alpha-001',
            'title' => 'Maintenance annuelle', 'contract_type' => 'maintenance', 'starts_at' => today()->toDateString(),
            'ends_at' => today()->addYear()->toDateString(), 'value_amount' => 5000000, 'currency' => 'XAF',
            'auto_renew' => false, 'notice_days' => 90,
        ])->assertCreated()->assertJsonPath('status', 'draft');
        $contractId = $created->json('id');

        $this->withHeaders($headers)->postJson("/api/v1/contracts/{$contractId}/activate")->assertUnprocessable();
        $this->withHeaders($headers)->post("/api/v1/contracts/{$contractId}/documents", [
            'document_type' => 'signed_contract',
            'file' => UploadedFile::fake()->create('contrat-signe.pdf', 120, 'application/pdf'),
        ])->assertCreated();
        $this->withHeaders($headers)->postJson("/api/v1/contracts/{$contractId}/activate")
            ->assertOk()->assertJsonPath('status', 'active');

        $this->assertDatabaseHas('contracts', ['id' => $contractId, 'status' => 'active']);
        $this->assertDatabaseCount('contract_documents', 1);
        $this->assertDatabaseHas('audit_logs', ['action' => 'contract.activated']);
    }
}
