<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\AutomationEvent;
use App\Models\AutomationSetting;
use App\Models\Contract;
use App\Models\Delivery;
use App\Models\Invoice;
use App\Models\InformationRequest;
use App\Models\PurchaseOrder;
use App\Models\Rfq;
use App\Models\SupplierDocument;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Crypt;

class AutomationService
{
    public function __construct(private readonly ContractService $contracts)
    {
    }

    public function run(?int $tenantId = null): array
    {
        $stats = ['tenants' => 0, 'events' => 0, 'recipients' => 0];
        $tenants = Tenant::query()->when($tenantId, fn ($query) => $query->whereKey($tenantId))->get();

        foreach ($tenants as $tenant) {
            $stats['tenants']++;
            $settings = AutomationSetting::query()->firstOrCreate(['tenant_id' => $tenant->id]);
            $owners = $this->users($tenant, ['owner', 'admin', 'buyer', 'procurement_manager']);
            $finance = $this->users($tenant, ['owner', 'admin', 'finance']);

            Rfq::query()->where('tenant_id', $tenant->id)->where('status', 'published')
                ->whereBetween('response_deadline', [now(), now()->addDays($settings->rfq_reminder_days)])
                ->each(fn ($item) => $this->emit($tenant, $settings, 'rfq_deadline', $item, "Consultation {$item->reference} a relancer", 'Les offres sont attendues avant le '.$item->response_deadline->format('d/m/Y').'.', "/rfqs/{$item->id}", $owners, $stats));

            InformationRequest::query()->where('tenant_id',$tenant->id)->where('status','published')
                ->whereBetween('response_deadline',[now(),now()->addDays($settings->rfq_reminder_days)])->with('suppliers')
                ->each(function(InformationRequest $rfi)use($tenant,$settings,$owners,&$stats):void{
                    $this->emit($tenant,$settings,'rfi_deadline',$rfi,"Demande d information {$rfi->reference} a suivre",'Les reponses fournisseurs sont attendues avant le '.$rfi->response_deadline->format('d/m/Y').'.',"/information-requests/{$rfi->id}",$owners,$stats);
                    foreach($rfi->suppliers->where('status','!=','submitted') as $invite){
                        try{$token=Crypt::decryptString($invite->access_token_encrypted);}catch(\Throwable){continue;}
                        $this->emitExternal($tenant,$settings,'rfi_supplier_reminder',$invite,$invite->contact_email,"Rappel - {$rfi->subject}",'Merci de repondre avant le '.$rfi->response_deadline->format('d/m/Y').'.',rtrim((string)config('app.frontend_url'),'/').'/supplier-portal/information-requests/'.$token,$stats);
                    }
                });

            PurchaseOrder::query()->where('tenant_id', $tenant->id)->where('status', 'in_validation')
                ->where('submitted_at', '<=', now()->subHours($settings->approval_reminder_hours))
                ->each(fn ($item) => $this->emit($tenant, $settings, 'order_approval', $item, "Validation du BC {$item->reference}", 'Une validation de commande est en attente.', "/purchase-orders/{$item->id}", $owners, $stats));

            Delivery::query()->where('tenant_id', $tenant->id)->whereIn('status', ['confirmed', 'partial'])
                ->whereDate('planned_at', '<=', today()->addDays($settings->delivery_reminder_days))
                ->each(fn ($item) => $this->emit($tenant, $settings, 'delivery_due', $item, 'Livraison attendue ou en retard', 'Une livraison necessite un suivi magasin.', "/deliveries/{$item->id}", $owners, $stats));

            Invoice::query()->where('tenant_id', $tenant->id)->whereNotIn('status', ['paid'])
                ->whereDate('due_at', '<=', today()->addDays($settings->invoice_reminder_days))
                ->each(fn ($item) => $this->emit($tenant, $settings, 'invoice_due', $item, "Facture {$item->invoice_number} proche de l echeance", 'Controlez ou finalisez son paiement.', "/invoices/{$item->id}", $finance, $stats));

            SupplierDocument::query()->where('tenant_id', $tenant->id)->whereNotNull('expires_at')
                ->whereDate('expires_at', '<=', today()->addDays($settings->document_expiry_days))
                ->each(fn ($item) => $this->emit($tenant, $settings, 'document_expiry', $item, 'Document fournisseur a renouveler', "Le document {$item->original_name} arrive a expiration.", "/suppliers/{$item->supplier_id}", $owners, $stats));

            $this->contracts->refreshStatuses($tenant->id);
            Contract::query()->where('tenant_id', $tenant->id)->whereIn('status', ['active', 'expiring'])
                ->whereBetween('ends_at', [today(), today()->addDays($settings->contract_expiry_days)])
                ->each(function (Contract $contract) use ($tenant, $settings, $owners, &$stats): void {
                    $recipients = $owners;
                    if ($contract->owner_user_id) {
                        $owner = $tenant->users()->whereKey($contract->owner_user_id)->first();
                        if ($owner) $recipients = $recipients->push($owner)->unique('id')->values();
                    }
                    $this->emit($tenant, $settings, 'contract_expiry', $contract, "Contrat {$contract->reference} a renouveler", 'Le contrat arrive a echeance le '.$contract->ends_at->format('d/m/Y').'.', "/contracts/{$contract->id}", $recipients, $stats);
                });
        }

        return $stats;
    }

    private function users(Tenant $tenant, array $roles): Collection
    {
        return $tenant->users()->wherePivotIn('role', $roles)->get()->unique('id')->values();
    }

    private function emit(Tenant $tenant, AutomationSetting $settings, string $type, Model $subject, string $title, string $body, string $url, Collection $users, array &$stats): void
    {
        if ($users->isEmpty() || AutomationEvent::query()->where(['tenant_id' => $tenant->id, 'event_type' => $type, 'subject_type' => $subject->getMorphClass(), 'subject_id' => $subject->getKey(), 'event_date' => today()->toDateString()])->exists()) return;
        foreach ($users as $user) {
            if ($settings->in_app_enabled) AppNotification::query()->create(['tenant_id' => $tenant->id, 'user_id' => $user->id, 'type' => $type, 'title' => $title, 'body' => $body, 'action_url' => $url]);
            if ($settings->email_enabled && $user->email) Mail::raw($body."\n\n".config('app.frontend_url').$url, fn ($mail) => $mail->to($user->email)->subject('[ProcuFlow] '.$title));
        }
        $count = $users->count();
        AutomationEvent::query()->create(['tenant_id' => $tenant->id, 'event_type' => $type, 'subject_type' => $subject->getMorphClass(), 'subject_id' => $subject->getKey(), 'event_date' => today(), 'recipients_count' => $count, 'sent_at' => now()]);
        $stats['events']++;
        $stats['recipients'] += $count;
    }

    private function emitExternal(Tenant $tenant,AutomationSetting $settings,string $type,Model $subject,string $email,string $title,string $body,string $url,array &$stats):void
    {
        if(!$settings->email_enabled||!$email||AutomationEvent::query()->where(['tenant_id'=>$tenant->id,'event_type'=>$type,'subject_type'=>$subject->getMorphClass(),'subject_id'=>$subject->getKey(),'event_date'=>today()->toDateString()])->exists())return;
        Mail::raw($body."\n\n".$url,fn($mail)=>$mail->to($email)->subject('[ProcuFlow] '.$title));
        AutomationEvent::query()->create(['tenant_id'=>$tenant->id,'event_type'=>$type,'subject_type'=>$subject->getMorphClass(),'subject_id'=>$subject->getKey(),'event_date'=>today(),'recipients_count'=>1,'sent_at'=>now()]);$stats['events']++;$stats['recipients']++;
    }
}
