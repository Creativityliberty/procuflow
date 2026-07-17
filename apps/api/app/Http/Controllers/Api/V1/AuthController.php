<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\ApprovalWorkflow;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController
{
    public function register(RegisterRequest $request)
    {
        $validated = $request->validated();

        [$user, $tenant] = DB::transaction(function () use ($validated): array {
            $tenant = Tenant::query()->create([
                'name' => $validated['company'],
                'legal_name' => $validated['company'],
                'slug' => $this->uniqueTenantSlug($validated['company']),
                'country' => $validated['country'],
                'company_size' => $validated['company_size'] ?? null,
                'currency' => $validated['currency'] ?? 'XAF',
            ]);

            $user = User::query()->create([
                'name' => trim($validated['first_name'].' '.$validated['last_name']),
                'email' => Str::lower($validated['email']),
                'password' => $validated['password'],
                'current_tenant_id' => $tenant->id,
            ]);

            $tenant->users()->attach($user->id, [
                'role' => 'owner',
                'joined_at' => now(),
            ]);

            TenantSubscription::query()->create([
                'tenant_id' => $tenant->id,
                'plan_code' => config('plans.default', 'growth'),
                'status' => 'trial',
                'billing_cycle' => 'monthly',
                'trial_ends_at' => now()->addDays((int) config('plans.trial_days', 14)),
                'current_period_starts_at' => now(),
                'current_period_ends_at' => now()->addDays((int) config('plans.trial_days', 14)),
            ]);

            $workflow = ApprovalWorkflow::query()->create([
                'tenant_id' => $tenant->id,
                'name' => 'Validation des demandes d\'achat',
                'document_type' => 'purchase_request',
                'is_active' => true,
            ]);

            $workflow->steps()->createMany([
                ['step_order' => 1, 'role' => 'manager', 'minimum_amount' => 0],
                ['step_order' => 2, 'role' => 'finance', 'minimum_amount' => 1000000],
                ['step_order' => 3, 'role' => 'director', 'minimum_amount' => 10000000],
            ]);

            return [$user, $tenant];
        });

        return response()->json($this->authPayload($user, $tenant, 'Compte cree'), 201);
    }

    public function login(LoginRequest $request)
    {
        $validated = $request->validated();
        $user = User::query()->where('email', Str::lower($validated['email']))->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        $tenant = $user->currentTenant;
        if (! $tenant || ! $user->tenants()->whereKey($tenant->id)->exists()) {
            $tenant = $user->tenants()->first();
            abort_unless($tenant, 403, 'Aucune entreprise accessible.');
            $user->update(['current_tenant_id' => $tenant->id]);
        }

        return response()->json($this->authPayload($user, $tenant, 'Connexion reussie'));
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('currentTenant');

        return response()->json([
            'user' => $user,
            'tenant' => $user->currentTenant,
            'role' => $user->current_tenant_id
                ? $user->roleForTenant($user->current_tenant_id)
                : null,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->noContent();
    }

    private function authPayload(User $user, Tenant $tenant, string $message): array
    {
        return [
            'message' => $message,
            'token' => $user->createToken('procuflow-web')->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $user->fresh(),
            'tenant' => $tenant,
            'role' => $user->roleForTenant($tenant->id),
        ];
    }

    private function uniqueTenantSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'entreprise';
        $slug = $base;
        $suffix = 2;

        while (Tenant::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }
}
