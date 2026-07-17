<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_cannot_select_or_read_an_unrelated_company(): void
    {
        $allowedTenant = Tenant::query()->create(['name' => 'Alpha', 'slug' => 'alpha']);
        $otherTenant = Tenant::query()->create(['name' => 'Beta', 'slug' => 'beta']);
        $user = User::query()->create([
            'name' => 'Alpha Owner',
            'email' => 'owner@alpha.test',
            'password' => 'Procuflow2026',
            'current_tenant_id' => $allowedTenant->id,
        ]);
        $allowedTenant->users()->attach($user, ['role' => 'owner']);
        Supplier::query()->create([
            'tenant_id' => $otherTenant->id,
            'legal_name' => 'Fournisseur Beta',
            'status' => 'active',
        ]);
        Sanctum::actingAs($user);

        $this->withHeader('X-Tenant-ID', (string) $otherTenant->id)
            ->getJson('/api/v1/suppliers')
            ->assertForbidden();

        $this->withHeader('X-Tenant-ID', (string) $allowedTenant->id)
            ->getJson('/api/v1/suppliers')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
