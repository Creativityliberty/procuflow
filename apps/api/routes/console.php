<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Services\AutomationService;
use App\Models\Tenant;
use App\Services\ReportingService;

Artisan::command('inspire', function (): void {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('procuflow:automations', function (AutomationService $service): void {
    $stats=$service->run();$this->info("{$stats['events']} evenement(s), {$stats['recipients']} destinataire(s).");
})->purpose('Execute les relances et alertes ProcuFlow');

Schedule::command('procuflow:automations')->dailyAt('07:00')->withoutOverlapping();

Artisan::command('procuflow:reports {type=all}', function (ReportingService $service): void {
    $type = (string) $this->argument('type');
    abort_unless(in_array($type, ['all', 'monthly', 'quarterly'], true), 422, 'Type attendu : all, monthly ou quarterly.');
    $monthlyFrom = now()->subMonthNoOverflow()->startOfMonth();
    $monthlyTo = $monthlyFrom->copy()->endOfMonth();
    $quarterlyFrom = now()->subQuarter()->startOfQuarter();
    $quarterlyTo = $quarterlyFrom->copy()->endOfQuarter();
    $count = 0;

    Tenant::query()->eachById(function (Tenant $tenant) use ($service, $type, $monthlyFrom, $monthlyTo, $quarterlyFrom, $quarterlyTo, &$count): void {
        if (in_array($type, ['all', 'monthly'], true)) {
            $service->distribute($service->snapshot($tenant->id, 'overview', $monthlyFrom, $monthlyTo));
            $service->distribute($service->snapshot($tenant->id, 'budget', $monthlyFrom, $monthlyTo));
            $count += 2;
        }
        if (in_array($type, ['all', 'quarterly'], true)) {
            $service->distribute($service->snapshot($tenant->id, 'suppliers', $quarterlyFrom, $quarterlyTo));
            $count++;
        }
    });

    $this->info("{$count} rapport(s) archive(s).");
})->purpose('Genere les rapports periodiques ProcuFlow');

Schedule::command('procuflow:reports monthly')->monthlyOn(1, '06:00')->withoutOverlapping();
Schedule::command('procuflow:reports quarterly')->cron('15 6 1 1,4,7,10 *')->withoutOverlapping();
