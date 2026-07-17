<?php

namespace App\Support;

use App\Models\User;

class TenantPermissions
{
    public const ROLES = [
        'owner', 'admin', 'requester', 'buyer', 'procurement_manager',
        'manager', 'storekeeper', 'accounting', 'finance', 'controller', 'director',
    ];

    private const PERMISSIONS = [
        'tenant.manage' => ['owner', 'admin'],
        'team.manage' => ['owner', 'admin'],
        'workflows.manage' => ['owner', 'admin'],
        'automations.manage' => ['owner', 'admin'],
        'reports.generate' => ['owner', 'admin', 'buyer', 'procurement_manager', 'finance', 'controller', 'director'],
        'suppliers.manage' => ['owner', 'admin', 'buyer', 'procurement_manager'],
        'contracts.manage' => ['owner', 'admin', 'buyer', 'procurement_manager'],
        'subscription.manage' => ['owner', 'admin'],
        'requests.create' => ['owner', 'admin', 'requester', 'buyer', 'procurement_manager', 'manager', 'storekeeper'],
        'requests.manage' => ['owner', 'admin', 'buyer', 'procurement_manager', 'manager'],
        'stock.check' => ['owner', 'admin', 'storekeeper', 'buyer', 'procurement_manager'],
        'rfqs.manage' => ['owner', 'admin', 'buyer', 'procurement_manager'],
        'orders.manage' => ['owner', 'admin', 'buyer', 'procurement_manager'],
        'deliveries.receive' => ['owner', 'admin', 'storekeeper', 'buyer', 'procurement_manager'],
        'invoices.control' => ['owner', 'admin', 'accounting', 'finance', 'buyer', 'procurement_manager'],
        'invoices.transmit' => ['owner', 'admin', 'accounting', 'finance'],
        'payments.confirm' => ['owner', 'admin', 'accounting', 'finance'],
    ];

    public function allows(User $user, int|string $tenantId, string $permission): bool
    {
        $role = $user->roleForTenant($tenantId);

        return $role !== null && in_array($role, self::PERMISSIONS[$permission] ?? [], true);
    }
}
