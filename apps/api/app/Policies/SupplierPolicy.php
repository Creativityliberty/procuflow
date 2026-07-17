<?php

namespace App\Policies;

use App\Models\Supplier;
use App\Models\User;

class SupplierPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->current_tenant_id !== null
            && $user->roleForTenant($user->current_tenant_id) !== null;
    }

    public function create(User $user): bool
    {
        return $user->current_tenant_id !== null
            && in_array($user->roleForTenant($user->current_tenant_id), ['owner', 'admin', 'buyer', 'procurement_manager'], true);
    }

    public function update(User $user, Supplier $supplier): bool
    {
        return $this->create($user) && (string) $supplier->tenant_id === (string) $user->current_tenant_id;
    }

    public function approve(User $user, Supplier $supplier): bool
    {
        return $user->current_tenant_id !== null
            && in_array($user->roleForTenant($user->current_tenant_id), ['owner', 'admin', 'procurement_manager'], true)
            && (string) $supplier->tenant_id === (string) $user->current_tenant_id
            && $supplier->status === 'pending';
    }
}
