<?php

namespace App\Http\Middleware;

use App\Support\TenantPermissions;
use Closure;
use Illuminate\Http\Request;

class RequireTenantPermission
{
    public function __construct(private readonly TenantPermissions $permissions)
    {
    }

    public function handle(Request $request, Closure $next, string $permission)
    {
        abort_unless(
            $request->user() && $this->permissions->allows($request->user(), app('tenant.id'), $permission),
            403,
            'Votre role ne permet pas cette action.'
        );

        return $next($request);
    }
}
