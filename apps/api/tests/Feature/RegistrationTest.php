<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_creates_a_company_owner_and_default_workflow(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Amina',
            'last_name' => 'Ndiaye',
            'email' => 'amina@example.test',
            'password' => 'Procuflow2026',
            'password_confirmation' => 'Procuflow2026',
            'company' => 'Amina Industries',
            'country' => 'SN',
            'company_size' => '11-50',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'amina@example.test')
            ->assertJsonPath('tenant.name', 'Amina Industries')
            ->assertJsonPath('role', 'owner')
            ->assertJsonStructure(['token']);

        $this->assertDatabaseHas('tenant_user', ['role' => 'owner']);
        $this->assertDatabaseCount('approval_workflow_steps', 3);
    }
}
