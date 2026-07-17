<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\ReportSnapshot;
use App\Services\AuditService;
use App\Services\ReportingService;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController
{
    public function __construct(private readonly ReportingService $reports, private readonly AuditService $audit)
    {
    }

    public function overview(Request $request)
    {
        [$from, $to] = $this->period($request);
        return response()->json($this->reports->overview((int) app('tenant.id'), $from, $to));
    }

    public function budget(Request $request)
    {
        [$from, $to] = $this->period($request);
        return response()->json($this->reports->budgetVariances((int) app('tenant.id'), $from, $to));
    }

    public function suppliers(Request $request)
    {
        [$from, $to] = $this->period($request);
        return response()->json($this->reports->supplierPerformance((int) app('tenant.id'), $from, $to));
    }

    public function snapshots()
    {
        return ReportSnapshot::query()->where('tenant_id', app('tenant.id'))
            ->select('id', 'report_type', 'frequency', 'period_start', 'period_end', 'generated_at')
            ->latest('generated_at')->limit(12)->get();
    }

    public function generate(Request $request)
    {
        $data = $request->validate(['type' => ['required', Rule::in(['overview', 'budget', 'suppliers'])], 'from' => ['required', 'date'], 'to' => ['required', 'date', 'after_or_equal:from']]);
        $from = Carbon::parse($data['from'])->startOfDay();
        $to = Carbon::parse($data['to'])->endOfDay();
        abort_if($from->diffInDays($to) > 730, 422, 'La periode ne peut pas depasser deux ans.');
        $snapshot = $this->reports->snapshot((int) app('tenant.id'), $data['type'], $from, $to, $request->user()->id);
        $recipients = $this->reports->distribute($snapshot);
        $this->audit->record('report.generated', $snapshot, ['type' => $data['type'], 'from' => $data['from'], 'to' => $data['to']]);
        return response()->json([...$snapshot->only(['id', 'report_type', 'frequency', 'period_start', 'period_end', 'generated_at']), 'recipients' => $recipients], 201);
    }

    public function export(Request $request): StreamedResponse
    {
        $data = $request->validate(['type' => ['required', Rule::in(['overview', 'budget', 'suppliers'])]]);
        [$from, $to] = $this->period($request);
        $type = $data['type'];
        $report = match ($type) {
            'budget' => $this->reports->budgetVariances((int) app('tenant.id'), $from, $to),
            'suppliers' => $this->reports->supplierPerformance((int) app('tenant.id'), $from, $to),
            default => $this->reports->overview((int) app('tenant.id'), $from, $to),
        };
        $filename = "procuflow-{$type}-{$from->toDateString()}-{$to->toDateString()}.csv";

        return response()->streamDownload(function () use ($type, $report): void {
            $stream = fopen('php://output', 'wb');
            fwrite($stream, "\xEF\xBB\xBF");
            if ($type === 'overview') {
                fputcsv($stream, ['Indicateur', 'Valeur'], ';');
                foreach ($report['metrics'] as $key => $value) fputcsv($stream, [$this->safe($key), $value], ';');
            } else {
                $rows = $report['rows'];
                if ($rows !== []) {
                    fputcsv($stream, array_keys($rows[0]), ';');
                    foreach ($rows as $row) fputcsv($stream, array_map(fn ($value) => $this->safe($value), array_values($row)), ';');
                }
            }
            fclose($stream);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function period(Request $request): array
    {
        $data = $request->validate(['from' => ['nullable', 'date'], 'to' => ['nullable', 'date', 'after_or_equal:from']]);
        $from = isset($data['from']) ? Carbon::parse($data['from'])->startOfDay() : now()->startOfYear();
        $to = isset($data['to']) ? Carbon::parse($data['to'])->endOfDay() : now()->endOfDay();
        abort_if($from->diffInDays($to) > 730, 422, 'La periode ne peut pas depasser deux ans.');
        return [$from, $to];
    }

    private function safe(mixed $value): string|int|float
    {
        if (is_int($value) || is_float($value)) return $value;
        $string = (string) ($value ?? '');
        return preg_match('/^[=+\-@]/', $string) ? "'".$string : $string;
    }
}
