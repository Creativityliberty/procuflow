<?php

namespace App\Http\Middleware;

use App\Services\TenantResolver;
use Closure;
use Illuminate\Http\Request;

class ResolveTenant
{
    public function __construct(private readonly TenantResolver $tenantResolver)
    {
    }

    public function handle(Request $request, Closure $next)
    {
        $tenantId = $this->tenantResolver->fromRequest($request);

        if (! $tenantId) {
            return response()->json(['message' => 'No accessible company is selected.'], 403);
        }

        app()->instance('tenant.id', $tenantId);

        return $next($request);
    }
}
