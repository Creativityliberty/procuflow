<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\AuditLog;

class AuditLogController
{
    public function index()
    {
        return AuditLog::query()
            ->where('tenant_id', app('tenant.id'))
            ->with('user:id,name,email')
            ->latest('id')
            ->paginate(30);
    }
}
