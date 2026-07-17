<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AcdeNeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_acde_need_keeps_all_four_sections(): void
    {
        $tenant = Tenant::query()->create(['name' => 'Alpha', 'slug' => 'alpha']);
        $user = User::query()->create([
            'name' => 'Alpha Owner',
            'email' => 'owner@alpha.test',
            'password' => 'Procuflow2026',
            'current_tenant_id' => $tenant->id,
        ]);
        $tenant->users()->attach($user, ['role' => 'owner']);
        Sanctum::actingAs($user);

        $response = $this->withHeader('X-Tenant-ID', (string) $tenant->id)
            ->postJson('/api/v1/acde-needs', [
                'title' => 'Regulateur de tension',
                'service' => 'Operations',
                'priority' => 'high',
                'items' => [
                    ['kind' => 'expectation', 'priority_level' => 'desired', 'content' => 'Proteger les equipements', 'criterion' => 'Disponibilite', 'target_value' => '99.9', 'unit' => '%', 'verification_method' => 'Rapport de test'],
                    ['kind' => 'constraint', 'priority_level' => 'mandatory', 'content' => 'Respecter les normes locales'],
                    ['kind' => 'data', 'priority_level' => 'mandatory', 'content' => 'Puissance requise', 'target_value' => '15', 'unit' => 'kVA'],
                    ['kind' => 'requirement', 'priority_level' => 'mandatory', 'content' => 'Garantie minimale de deux ans', 'criterion' => 'Garantie', 'target_value' => '24', 'unit' => 'mois'],
                ],
                'budget_amount' => 2500000,
                'currency' => 'XAF',
                'delivery_location' => 'Entrepot central Douala',
            ])
            ->assertCreated()
            ->assertJsonCount(4, 'items')
            ->assertJsonPath('items.0.kind', 'expectation')
            ->assertJsonPath('items.3.kind', 'requirement');

        $this->assertDatabaseHas('acde_needs', [
            'id' => $response->json('id'),
            'tenant_id' => $tenant->id,
            'service' => 'Operations',
            'budget_amount' => 2500000,
        ]);
        $this->assertDatabaseHas('acde_items', ['acde_need_id' => $response->json('id'), 'criterion' => 'Garantie', 'priority_level' => 'mandatory']);
        $this->assertDatabaseCount('acde_items', 4);

        Storage::fake('private');
        $document = $this->withHeader('X-Tenant-ID', (string) $tenant->id)
            ->post('/api/v1/acde-needs/'.$response->json('id').'/documents', ['file' => UploadedFile::fake()->create('fiche-technique.pdf', 120, 'application/pdf')])
            ->assertCreated();
        $this->assertDatabaseHas('acde_documents', ['id' => $document->json('id'), 'original_name' => 'fiche-technique.pdf']);
    }
}
