<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\UpdateTenantRequest;
use App\Models\Tenant;
use App\Services\AuditService;
use Illuminate\Http\Request;

class TenantController
{
    public function __construct(private readonly AuditService $audit)
    {
    }

    public function index(Request $request)
    {
        return $request->user()->tenants()
            ->select('tenants.*')
            ->orderBy('tenants.name')
            ->get()
            ->map(fn (Tenant $tenant): array => [
                ...$tenant->toArray(),
                'role' => $tenant->pivot->role,
                'is_current' => (int) $tenant->id === (int) $request->user()->current_tenant_id,
            ]);
    }

    public function current(Request $request)
    {
        $tenant = Tenant::query()->findOrFail(app('tenant.id'));

        return response()->json([
            'tenant' => $tenant,
            'role' => $request->user()->roleForTenant($tenant->id),
        ]);
    }

    public function update(UpdateTenantRequest $request)
    {
        $tenant = Tenant::query()->findOrFail(app('tenant.id'));
        $data = $request->safe()->except('complete_onboarding');

        if ($request->boolean('complete_onboarding')) {
            $data['onboarding_completed_at'] = now();
        }

        $tenant->update($data);
        $this->audit->record('tenant.updated', $tenant, ['fields' => array_keys($data)]);

        return response()->json($tenant->fresh());
    }

    public function switch(Request $request, Tenant $tenant)
    {
        abort_unless($request->user()->tenants()->whereKey($tenant->id)->exists(), 404);

        $request->user()->update(['current_tenant_id' => $tenant->id]);

        return response()->json([
            'tenant' => $tenant,
            'role' => $request->user()->roleForTenant($tenant->id),
        ]);
    }
}
