<?php

namespace App\Services;

use App\Models\Contract;

class ContractService
{
    public function refreshStatuses(?int $tenantId = null): int
    {
        $updated = 0;
        Contract::query()->when($tenantId, fn ($query) => $query->where('tenant_id', $tenantId))
            ->whereIn('status', ['active', 'expiring', 'expired'])
            ->each(function (Contract $contract) use (&$updated): void {
                $status = $contract->ends_at->lt(today())
                    ? 'expired'
                    : ($contract->ends_at->lessThanOrEqualTo(today()->addDays($contract->notice_days)) ? 'expiring' : 'active');
                if ($status === $contract->status) return;
                $from = $contract->status;
                $contract->update(['status' => $status]);
                $contract->events()->create(['action' => 'status_updated', 'from_status' => $from, 'to_status' => $status, 'comment' => 'Mise a jour automatique selon la date d echeance.']);
                $updated++;
            });
        return $updated;
    }
}
