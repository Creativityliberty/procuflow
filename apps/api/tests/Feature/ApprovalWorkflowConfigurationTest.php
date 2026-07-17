<?php

namespace Tests\Feature;

use App\Models\ApprovalWorkflow;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApprovalWorkflowConfigurationTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_owner_can_configure_the_workflow_and_receive_actionable_approvals(): void
    {
        [$tenant, $owner, $workflow] = $this->createCompany();
        Sanctum::actingAs($owner);
        $headers = ['X-Tenant-ID' => (string) $tenant->id];

        $this->withHeaders($headers)->putJson('/api/v1/approval-workflow', [
            'name' => 'Circuit achats Alpha',
            'steps' => [
                ['role' => 'manager', 'minimum_amount' => 0],
                ['role' => 'finance', 'minimum_amount' => 2000000],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('name', 'Circuit achats Alpha')
            ->assertJsonCount(2, 'steps');

        $created = $this->withHeaders($headers)->postJson('/api/v1/purchase-requests', [
            'title' => 'Serveurs de production',
            'service' => 'Informatique',
            'cost_center' => 'CC-320',
            'priority' => 'high',
            'reason' => 'Renouvellement de capacite',
            'action' => 'submit',
            'items' => [[
                'description' => 'Serveur',
                'quantity' => 2,
                'unit' => 'unite',
                'estimated_unit_price' => 1500000,
            ]],
        ])->assertCreated()->assertJsonCount(2, 'approvals');

        $this->withHeaders($headers)->getJson('/api/v1/approvals/inbox')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.purchase_request.id', $created->json('id'))
            ->assertJsonPath('data.0.role', 'manager');

        $this->assertDatabaseCount('approval_workflow_steps', 2);
        $this->assertDatabaseHas('audit_logs', ['action' => 'approval_workflow.updated']);
    }

    public function test_a_requester_cannot_change_the_company_workflow(): void
    {
        [$tenant, $owner] = $this->createCompany();
        $requester = User::query()->create([
            'name' => 'Alpha Requester',
            'email' => 'requester@alpha.test',
            'password' => 'Procuflow2026',
            'current_tenant_id' => $tenant->id,
        ]);
        $tenant->users()->attach($requester, ['role' => 'requester']);
        Sanctum::actingAs($requester);

        $this->withHeader('X-Tenant-ID', (string) $tenant->id)
            ->putJson('/api/v1/approval-workflow', [
                'name' => 'Circuit interdit',
                'steps' => [['role' => 'manager', 'minimum_amount' => 0]],
            ])
            ->assertForbidden();
    }

    private function createCompany(): array
    {
        $tenant = Tenant::query()->create(['name' => 'Alpha', 'slug' => 'alpha']);
        $owner = User::query()->create([
            'name' => 'Alpha Owner',
            'email' => 'owner@alpha.test',
            'password' => 'Procuflow2026',
            'current_tenant_id' => $tenant->id,
        ]);
        $tenant->users()->attach($owner, ['role' => 'owner']);
        $workflow = ApprovalWorkflow::query()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Demandes',
            'document_type' => 'purchase_request',
            'is_active' => true,
        ]);
        $workflow->steps()->create([
            'step_order' => 1,
            'role' => 'manager',
            'minimum_amount' => 0,
        ]);

        return [$tenant, $owner, $workflow];
    }
}
