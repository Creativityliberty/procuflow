<?php

namespace Tests\Feature;

use App\Models\ApprovalWorkflow;
use App\Models\AcdeNeed;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PurchaseRequestWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_purchase_request_follows_amount_based_approval_steps(): void
    {
        $tenant = Tenant::query()->create(['name' => 'Alpha', 'slug' => 'alpha']);
        $user = User::query()->create([
            'name' => 'Alpha Owner',
            'email' => 'owner@alpha.test',
            'password' => 'Procuflow2026',
            'current_tenant_id' => $tenant->id,
        ]);
        $tenant->users()->attach($user, ['role' => 'owner']);
        $workflow = ApprovalWorkflow::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Demandes',
            'document_type' => 'purchase_request',
            'is_active' => true,
        ]);
        $workflow->steps()->createMany([
            ['step_order' => 1, 'role' => 'manager', 'minimum_amount' => 0],
            ['step_order' => 2, 'role' => 'finance', 'minimum_amount' => 1000000],
            ['step_order' => 3, 'role' => 'director', 'minimum_amount' => 10000000],
        ]);
        Sanctum::actingAs($user);

        $need = AcdeNeed::query()->create([
            'tenant_id' => $tenant->id,
            'created_by' => $user->id,
            'title' => 'Besoin informatique structure',
            'service' => 'Finance',
            'status' => 'draft',
            'priority' => 'high',
            'budget_amount' => 2000000,
            'currency' => 'XAF',
            'delivery_location' => 'Siege Douala',
        ]);

        $payload = [
                'acde_need_id' => $need->id,
                'title' => 'Equipement informatique',
                'service' => 'Finance',
                'cost_center' => 'CC-210',
                'priority' => 'high',
                'reason' => 'Renouvellement du parc',
                'action' => 'submit',
                'items' => [[
                    'description' => 'Ordinateur portable',
                    'quantity' => 2,
                    'unit' => 'unite',
                    'estimated_unit_price' => 1000000,
                ]],
            ];

        $created = $this->withHeader('X-Tenant-ID', (string) $tenant->id)
            ->postJson('/api/v1/purchase-requests', $payload)
            ->assertCreated()
            ->assertJsonPath('status', 'pending')
            ->assertJsonCount(2, 'approvals');

        $id = $created->json('id');
        $headers = ['X-Tenant-ID' => (string) $tenant->id];
        $this->assertDatabaseHas('acde_needs', ['id' => $need->id, 'status' => 'converted']);
        $this->withHeaders($headers)->postJson('/api/v1/purchase-requests', [...$payload, 'action' => 'draft'])->assertUnprocessable();

        $this->withHeaders($headers)->postJson("/api/v1/purchase-requests/{$id}/approve")->assertOk();
        $this->withHeaders($headers)->postJson("/api/v1/purchase-requests/{$id}/approve")
            ->assertOk()
            ->assertJsonPath('status', 'approved');
    }
}
