<?php

namespace App\Services;

use App\Models\ProcurementPolicyTier;
use Illuminate\Support\Collection;

class ProcurementPolicyService
{
    public function tiers(int $tenantId): Collection
    {
        $this->ensureDefaults($tenantId);
        return ProcurementPolicyTier::query()->where('tenant_id', $tenantId)->where('is_active', true)->orderBy('position')->get();
    }

    public function tierFor(int $tenantId, int $amount): ProcurementPolicyTier
    {
        $tier = $this->tiers($tenantId)->first(fn (ProcurementPolicyTier $tier): bool => $amount >= $tier->minimum_amount && ($tier->maximum_amount === null || $amount <= $tier->maximum_amount));
        abort_unless($tier, 422, 'Aucune regle achat ne couvre ce montant.');
        return $tier;
    }

    public function replace(int $tenantId, array $tiers): Collection
    {
        $expected = 0;
        foreach ($tiers as $index => $tier) {
            abort_unless((int) $tier['minimum_amount'] === $expected, 422, 'Les tranches doivent etre continues et sans chevauchement.');
            if ($index === array_key_last($tiers)) abort_unless(($tier['maximum_amount'] ?? null) === null, 422, 'La derniere tranche doit etre sans plafond.');
            else { abort_if(($tier['maximum_amount'] ?? null) === null, 422, 'Un plafond intermediaire est requis.'); $expected = (int) $tier['maximum_amount'] + 1; }
        }
        ProcurementPolicyTier::query()->where('tenant_id', $tenantId)->delete();
        foreach ($tiers as $index => $tier) ProcurementPolicyTier::query()->create([...$tier, 'tenant_id'=>$tenantId, 'position'=>$index + 1, 'is_active'=>true]);
        return $this->tiers($tenantId);
    }

    public function ensureDefaults(int $tenantId): void
    {
        if (ProcurementPolicyTier::query()->where('tenant_id', $tenantId)->exists()) return;
        $tiers = [
            ['name'=>'Achat direct','minimum_amount'=>0,'maximum_amount'=>99999,'required_quotes'=>1,'competition_method'=>'direct_purchase','validator_roles'=>['procurement_manager']],
            ['name'=>'Consultation simplifiee','minimum_amount'=>100000,'maximum_amount'=>999999,'required_quotes'=>2,'competition_method'=>'simplified_rfq','validator_roles'=>['procurement_manager','finance']],
            ['name'=>'Consultation concurrentielle','minimum_amount'=>1000000,'maximum_amount'=>9999999,'required_quotes'=>3,'competition_method'=>'competitive_rfq','validator_roles'=>['procurement_manager','finance','director']],
            ['name'=>'Appel d offres restreint','minimum_amount'=>10000000,'maximum_amount'=>100000000,'required_quotes'=>3,'competition_method'=>'restricted_tender','validator_roles'=>['director','finance']],
            ['name'=>'Appel d offres formel','minimum_amount'=>100000001,'maximum_amount'=>null,'required_quotes'=>5,'competition_method'=>'formal_tender','validator_roles'=>['director','procurement_committee']],
        ];
        foreach ($tiers as $index => $tier) ProcurementPolicyTier::query()->create([...$tier, 'tenant_id'=>$tenantId, 'position'=>$index + 1, 'is_active'=>true]);
    }
}
