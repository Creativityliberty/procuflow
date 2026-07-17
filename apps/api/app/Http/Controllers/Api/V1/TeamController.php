<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\User;
use App\Services\AuditService;
use App\Services\SubscriptionService;
use App\Support\TenantPermissions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class TeamController
{
    public function __construct(
        private readonly AuditService $audit,
        private readonly SubscriptionService $subscriptions,
    )
    {
    }

    public function index()
    {
        $tenant = Tenant::query()->findOrFail(app('tenant.id'));

        return response()->json([
            'members' => $tenant->users()->select('users.id', 'users.name', 'users.email')->orderBy('users.name')->get()
                ->map(fn (User $user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->pivot->role,
                    'job_title' => $user->pivot->job_title,
                    'joined_at' => $user->pivot->joined_at,
                ]),
            'invitations' => TenantInvitation::query()
                ->where('tenant_id', $tenant->id)
                ->whereNull('accepted_at')
                ->whereNull('revoked_at')
                ->latest('id')
                ->get(['id', 'email', 'role', 'expires_at', 'created_at']),
            'roles' => TenantPermissions::ROLES,
        ]);
    }

    public function invite(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'role' => ['required', Rule::in(TenantPermissions::ROLES)],
        ]);
        $tenant = Tenant::query()->findOrFail(app('tenant.id'));
        $this->subscriptions->assertWithinLimit($tenant, 'users');
        abort_if($data['role'] === 'owner' && $request->user()->roleForTenant($tenant->id) !== 'owner', 403, 'Seul un proprietaire peut nommer un autre proprietaire.');
        $email = Str::lower($data['email']);
        $existing = User::query()->where('email', $email)->first();
        abort_if($existing && $tenant->users()->whereKey($existing->id)->exists(), 422, 'Cette personne appartient deja a l equipe.');

        $token = Str::random(64);
        TenantInvitation::query()
            ->where('tenant_id', $tenant->id)
            ->where('email', $email)
            ->whereNull('accepted_at')
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);

        $invitation = TenantInvitation::query()->create([
            'tenant_id' => $tenant->id,
            'email' => $email,
            'role' => $data['role'],
            'invited_by' => $request->user()->id,
            'token_hash' => hash('sha256', $token),
            'token_last_four' => substr($token, -4),
            'expires_at' => now()->addDays(7),
        ]);
        $url = rtrim((string) config('app.frontend_url'), '/').'/accept-invitation/'.$token;

        Mail::raw(
            "Bonjour,\n\nVous etes invite(e) a rejoindre {$tenant->name} sur ProcuFlow.\nCette invitation expire dans 7 jours : {$url}",
            fn ($mail) => $mail->to($email)->subject("Invitation ProcuFlow - {$tenant->name}")
        );
        $this->audit->record('team.invitation_sent', $invitation, ['email' => $email, 'role' => $data['role']]);

        return response()->json($invitation->only(['id', 'email', 'role', 'expires_at', 'created_at']), 201);
    }

    public function showInvitation(string $token)
    {
        $invitation = $this->validInvitation($token)->load('tenant:id,name');

        return response()->json([
            'email' => $invitation->email,
            'role' => $invitation->role,
            'tenant' => $invitation->tenant,
            'expires_at' => $invitation->expires_at,
            'existing_user' => User::query()->where('email', $invitation->email)->exists(),
        ]);
    }

    public function acceptInvitation(Request $request, string $token)
    {
        $invitation = $this->validInvitation($token);
        $user = User::query()->where('email', $invitation->email)->first();
        $rules = [
            'password' => ['required', $user ? 'string' : 'confirmed', $user ? null : Password::min(10)->letters()->numbers()],
            'name' => [$user ? 'nullable' : 'required', 'string', 'max:255'],
        ];
        $rules['password'] = array_values(array_filter($rules['password']));
        $data = $request->validate($rules);

        if ($user) {
            abort_unless(Hash::check($data['password'], $user->password), 422, 'Le mot de passe du compte existant est incorrect.');
        }

        [$user, $tenant] = DB::transaction(function () use ($data, $invitation, $user): array {
            $account = $user ?? User::query()->create([
                'name' => $data['name'],
                'email' => $invitation->email,
                'password' => $data['password'],
            ]);
            $tenant = $invitation->tenant()->lockForUpdate()->firstOrFail();
            $tenant->users()->syncWithoutDetaching([
                $account->id => ['role' => $invitation->role, 'joined_at' => now()],
            ]);
            $account->update(['current_tenant_id' => $tenant->id]);
            $invitation->update(['accepted_at' => now()]);

            return [$account, $tenant];
        });

        app()->instance('tenant.id', $tenant->id);
        $this->audit->record('team.invitation_accepted', $invitation, ['user_id' => $user->id]);

        return response()->json([
            'message' => 'Invitation acceptee.',
            'token' => $user->createToken('procuflow-web')->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $user,
            'tenant' => $tenant,
            'role' => $invitation->role,
        ]);
    }

    public function updateMember(Request $request, User $user)
    {
        $tenant = Tenant::query()->findOrFail(app('tenant.id'));
        abort_unless($tenant->users()->whereKey($user->id)->exists(), 404);
        $data = $request->validate([
            'role' => ['required', Rule::in(TenantPermissions::ROLES)],
            'job_title' => ['nullable', 'string', 'max:120'],
        ]);
        $currentRole = $user->roleForTenant($tenant->id);
        abort_if(($currentRole === 'owner' || $data['role'] === 'owner') && $request->user()->roleForTenant($tenant->id) !== 'owner', 403, 'Seul un proprietaire peut modifier ce role.');
        abort_if($currentRole === 'owner' && $data['role'] !== 'owner' && $this->ownerCount($tenant) === 1, 422, 'Une entreprise doit conserver au moins un proprietaire.');
        $tenant->users()->updateExistingPivot($user->id, ['role' => $data['role'], 'job_title' => $data['job_title'] ?? null]);
        $this->audit->record('team.member_updated', $user, ['from_role' => $currentRole, 'role' => $data['role']]);

        return response()->json(['message' => 'Membre mis a jour.']);
    }

    public function removeMember(Request $request, User $user)
    {
        $tenant = Tenant::query()->findOrFail(app('tenant.id'));
        abort_unless($tenant->users()->whereKey($user->id)->exists(), 404);
        abort_if((int) $request->user()->id === (int) $user->id, 422, 'Vous ne pouvez pas retirer votre propre acces.');
        abort_if($user->roleForTenant($tenant->id) === 'owner' && $request->user()->roleForTenant($tenant->id) !== 'owner', 403, 'Seul un proprietaire peut retirer un proprietaire.');
        abort_if($user->roleForTenant($tenant->id) === 'owner' && $this->ownerCount($tenant) === 1, 422, 'Le dernier proprietaire ne peut pas etre retire.');
        $tenant->users()->detach($user->id);
        if ((int) $user->current_tenant_id === (int) $tenant->id) {
            $user->update(['current_tenant_id' => $user->tenants()->value('tenants.id')]);
        }
        $this->audit->record('team.member_removed', $user);

        return response()->noContent();
    }

    public function revokeInvitation(TenantInvitation $invitation)
    {
        abort_unless((int) $invitation->tenant_id === (int) app('tenant.id'), 404);
        abort_if($invitation->accepted_at || $invitation->revoked_at, 422, 'Cette invitation est deja terminee.');
        $invitation->update(['revoked_at' => now()]);
        $this->audit->record('team.invitation_revoked', $invitation);

        return response()->noContent();
    }

    private function validInvitation(string $token): TenantInvitation
    {
        abort_unless(strlen($token) === 64, 404);

        return TenantInvitation::query()
            ->where('token_hash', hash('sha256', $token))
            ->whereNull('accepted_at')
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->firstOrFail();
    }

    private function ownerCount(Tenant $tenant): int
    {
        return $tenant->users()->wherePivot('role', 'owner')->count();
    }
}
