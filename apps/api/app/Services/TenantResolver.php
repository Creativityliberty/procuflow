<?php

namespace App\Services;

use Illuminate\Http\Request;

class TenantResolver
{
    public function fromRequest(Request $request): ?int
    {
        $user = $request->user();

        if (! $user) {
            return null;
        }

        $requestedId = $request->header('X-Tenant-ID') ?: $user->current_tenant_id;

        if (! $requestedId) {
            return null;
        }

        return $user->tenants()->whereKey($requestedId)->exists()
            ? (int) $requestedId
            : null;
    }
}
