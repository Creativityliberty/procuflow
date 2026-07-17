<?php

namespace Database\Seeders;

use App\Models\AcdeNeed;
use App\Models\ApprovalWorkflow;
use App\Models\PurchaseRequest;
use App\Models\Supplier;
use App\Models\StockCheck;
use App\Models\Tenant;
use App\Models\User;
use App\Services\ProcurementPolicyService;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::query()->firstOrCreate(
            ['slug' => 'yogi-conseils'],
            [
                'name' => 'Yogi Conseils',
                'legal_name' => 'Yogi Conseils',
                'country' => 'CM',
                'city' => 'Douala',
                'currency' => 'XAF',
                'rfq_threshold' => 500000,
                'default_payment_days' => 30,
                'cost_center_required' => true,
                'onboarding_completed_at' => now(),
            ]
        );

        $user = User::query()->firstOrCreate(
            ['email' => 'demo@procuflow.local'],
            [
                'name' => 'Armand Essomba',
                'password' => 'Procuflow2026',
                'current_tenant_id' => $tenant->id,
                'email_verified_at' => now(),
            ]
        );
        $user->update(['current_tenant_id' => $tenant->id]);
        $tenant->users()->syncWithoutDetaching([
            $user->id => ['role' => 'owner', 'joined_at' => now()],
        ]);

        $workflow = ApprovalWorkflow::query()->firstOrCreate(
            ['tenant_id' => $tenant->id, 'document_type' => 'purchase_request'],
            ['name' => 'Validation des demandes d\'achat', 'is_active' => true]
        );
        if ($workflow->steps()->doesntExist()) {
            $workflow->steps()->createMany([
                ['step_order' => 1, 'role' => 'manager', 'minimum_amount' => 0],
                ['step_order' => 2, 'role' => 'finance', 'minimum_amount' => 1000000],
                ['step_order' => 3, 'role' => 'director', 'minimum_amount' => 10000000],
            ]);
        }
        app(ProcurementPolicyService::class)->ensureDefaults($tenant->id);

        Supplier::query()->firstOrCreate(
            ['tenant_id' => $tenant->id, 'niu' => 'M012345678901A'],
            [
                'legal_name' => 'CamTech Services',
                'rccm' => 'RC/DLA/2024/B/00125',
                'email' => 'contact@camtech.example',
                'phone' => '+237600000000',
                'contact_name' => 'Nadine Mbarga',
                'category' => 'Informatique',
                'city' => 'Douala',
                'country' => 'CM',
                'status' => 'active',
                'score' => 4.60,
            ]
        );
        foreach ([
            ['niu'=>'M098765432101B','legal_name'=>'Digital Office Cameroun','email'=>'offres@digitaloffice.example','city'=>'Douala','score'=>4.30],
            ['niu'=>'M011122233344C','legal_name'=>'AfriSupply Solutions','email'=>'commercial@afrisupply.example','city'=>'Yaounde','score'=>4.10],
        ] as $supplier) {
            Supplier::query()->firstOrCreate(['tenant_id'=>$tenant->id,'niu'=>$supplier['niu']], [...$supplier,'category'=>'Informatique','country'=>'CM','status'=>'active']);
        }

        $need = AcdeNeed::query()->firstOrCreate(
            ['tenant_id' => $tenant->id, 'title' => 'Renouvellement du parc informatique finance'],
            [
                'created_by' => $user->id,
                'context' => 'Postes devenus insuffisants pour les outils comptables.',
                'service' => 'Finance',
                'status' => 'approved',
                'needed_at' => now(),
                'priority' => 'high',
            ]
        );
        if ($need->items()->doesntExist()) {
            $need->items()->createMany([
                ['kind' => 'expectation', 'content' => 'Ameliorer la productivite de l equipe Finance.', 'position' => 0],
                ['kind' => 'constraint', 'content' => 'Compatibilite avec le parc et les normes de securite.', 'position' => 1],
                ['kind' => 'data', 'content' => 'Cinq postes a livrer a Douala avant la cloture trimestrielle.', 'position' => 2],
                ['kind' => 'requirement', 'content' => 'Garantie de trois ans et assistance locale.', 'position' => 3],
            ]);
        }

        $purchaseRequest = PurchaseRequest::query()->firstOrCreate(
            ['reference' => 'DA-2026-000001'],
            [
                'tenant_id' => $tenant->id,
                'created_by' => $user->id,
                'title' => 'Ordinateurs pour l\'equipe finance',
                'service' => 'Finance',
                'cost_center' => 'CC-210 Finance',
                'priority' => 'high',
                'reason' => 'Renouveler les postes de travail ralentis.',
                'currency' => 'XAF',
                'estimated_amount' => 6200000,
                'status' => 'draft',
            ]
        );
        if ($purchaseRequest->items()->doesntExist()) {
            $purchaseRequest->items()->create([
                'description' => 'Ordinateur portable professionnel',
                'quantity' => 5,
                'unit' => 'unite',
                'estimated_unit_price' => 1240000,
            ]);
        }
        if ($purchaseRequest->stockCheck()->doesntExist()) {
            $check = StockCheck::query()->create(['tenant_id'=>$tenant->id,'purchase_request_id'=>$purchaseRequest->id,'checked_by'=>$user->id,'result'=>'unavailable','notes'=>'Aucun poste compatible disponible.','checked_at'=>now()]);
            foreach ($purchaseRequest->items as $item) $check->items()->create(['purchase_request_item_id'=>$item->id,'requested_quantity'=>$item->quantity,'available_quantity'=>0,'procurement_quantity'=>$item->quantity,'result'=>'unavailable']);
        }
    }
}
