<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_requester_cannot_execute_a_buyer_action(): void
    {
        [$tenant, $requester] = $this->tenantUser('requester', 'requester@test.dev');
        Sanctum::actingAs($requester);

        $this->withHeader('X-Tenant-ID', (string) $tenant->id)
            ->postJson('/api/v1/purchase-orders', [])
            ->assertForbidden()
            ->assertJsonPath('message', 'Votre role ne permet pas cette action.');
    }

    public function test_owner_reaches_the_business_validation_after_permission_check(): void
    {
        [$tenant, $owner] = $this->tenantUser('owner', 'owner@test.dev');
        Sanctum::actingAs($owner);

        $this->withHeader('X-Tenant-ID', (string) $tenant->id)
            ->postJson('/api/v1/purchase-orders', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('rfq_comparison_id');
    }

    public function test_invitation_creates_a_member_and_cannot_be_reused(): void
    {
        [$tenant, $owner] = $this->tenantUser('owner', 'owner@test.dev');
        $token = str_repeat('a', 64);
        TenantInvitation::query()->create([
            'tenant_id' => $tenant->id,
            'email' => 'buyer@test.dev',
            'role' => 'buyer',
            'invited_by' => $owner->id,
            'token_hash' => hash('sha256', $token),
            'token_last_four' => 'aaaa',
            'expires_at' => now()->addDay(),
        ]);

        $this->postJson("/api/v1/invitations/{$token}/accept", [
            'name' => 'Awa Buyer',
            'password' => 'Procuflow2026',
            'password_confirmation' => 'Procuflow2026',
        ])->assertOk()->assertJsonPath('role', 'buyer')->assertJsonStructure(['token']);

        $this->assertDatabaseHas('tenant_user', ['tenant_id' => $tenant->id, 'role' => 'buyer']);
        $this->getJson("/api/v1/invitations/{$token}")->assertNotFound();
    }

    public function test_expired_invitation_is_rejected(): void
    {
        [$tenant, $owner] = $this->tenantUser('owner', 'owner@test.dev');
        $token = str_repeat('b', 64);
        TenantInvitation::query()->create([
            'tenant_id' => $tenant->id,
            'email' => 'expired@test.dev',
            'role' => 'buyer',
            'invited_by' => $owner->id,
            'token_hash' => hash('sha256', $token),
            'token_last_four' => 'bbbb',
            'expires_at' => now()->subMinute(),
        ]);

        $this->getJson("/api/v1/invitations/{$token}")->assertNotFound();
    }

    public function test_password_reset_revokes_existing_api_tokens(): void
    {
        [, $user] = $this->tenantUser('owner', 'reset@test.dev');
        $user->createToken('old-session');
        $token = Password::broker()->createToken($user);

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'Nouveau2026Secure',
            'password_confirmation' => 'Nouveau2026Secure',
        ])->assertOk();

        $this->assertTrue(Hash::check('Nouveau2026Secure', $user->fresh()->password));
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    private function tenantUser(string $role, string $email): array
    {
        $tenant = Tenant::query()->create(['name' => 'Alpha', 'slug' => 'alpha-'.uniqid()]);
        $user = User::query()->create([
            'name' => ucfirst($role),
            'email' => $email,
            'password' => 'Procuflow2026',
            'current_tenant_id' => $tenant->id,
        ]);
        $tenant->users()->attach($user, ['role' => $role]);

        return [$tenant, $user];
    }
}
