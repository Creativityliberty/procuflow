<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\StoreAcdeNeedRequest;
use App\Models\AcdeNeed;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AcdeNeedController
{
    public function __construct(private readonly AuditService $audit)
    {
    }

    public function index(Request $request)
    {
        return AcdeNeed::query()
            ->where('tenant_id', app('tenant.id'))
            ->when($request->string('status')->toString(), fn ($query, $status) => $query->where('status', $status))
            ->when($request->string('search')->toString(), fn ($query, $search) => $query->where('title', 'like', "%{$search}%"))
            ->with(['items', 'creator:id,name,email', 'documents.uploader:id,name'])
            ->latest()
            ->paginate(20);
    }

    public function store(StoreAcdeNeedRequest $request)
    {
        $data = $request->validated();
        $items = $data['items'];
        unset($data['items']);

        $need = DB::transaction(function () use ($data, $items, $request): AcdeNeed {
            $need = AcdeNeed::query()->create([
                ...$data,
                'tenant_id' => app('tenant.id'),
                'created_by' => $request->user()?->id,
                'status' => 'draft',
            ]);

            $need->items()->createMany(collect($items)
                ->values()
                ->map(fn (array $item, int $position): array => [...$item, 'position' => $position])
                ->all());

            return $need;
        });

        $this->audit->record('acde_need.created', $need, ['title' => $need->title]);

        return response()->json($need->load(['items', 'creator:id,name,email', 'documents.uploader:id,name']), 201);
    }

    public function show(AcdeNeed $acdeNeed)
    {
        $this->assertTenant($acdeNeed);

        return $acdeNeed->load(['items', 'creator:id,name,email', 'documents.uploader:id,name']);
    }

    public function update(StoreAcdeNeedRequest $request, AcdeNeed $acdeNeed)
    {
        $this->assertTenant($acdeNeed);
        abort_unless($acdeNeed->status === 'draft', 422, 'Seul un besoin en brouillon peut etre modifie.');

        $data = $request->validated();
        $items = $data['items'] ?? null;
        unset($data['items']);

        DB::transaction(function () use ($acdeNeed, $data, $items): void {
            $acdeNeed->update($data);
            if ($items !== null) {
                $acdeNeed->items()->delete();
                $acdeNeed->items()->createMany(collect($items)
                    ->values()
                    ->map(fn (array $item, int $position): array => [...$item, 'position' => $position])
                    ->all());
            }
        });

        $this->audit->record('acde_need.updated', $acdeNeed);

        return $acdeNeed->fresh(['items', 'creator:id,name,email', 'documents.uploader:id,name']);
    }

    public function destroy(AcdeNeed $acdeNeed)
    {
        $this->assertTenant($acdeNeed);
        abort_unless($acdeNeed->status === 'draft', 422, 'Seul un besoin en brouillon peut etre supprime.');

        $this->audit->record('acde_need.deleted', $acdeNeed, ['title' => $acdeNeed->title]);
        foreach ($acdeNeed->documents as $document) Storage::disk($document->disk)->delete($document->storage_path);
        $acdeNeed->delete();

        return response()->noContent();
    }

    private function assertTenant(AcdeNeed $acdeNeed): void
    {
        abort_unless((int) $acdeNeed->tenant_id === (int) app('tenant.id'), 404);
    }
}
