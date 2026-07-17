<?php
namespace Tests\Feature;
use App\Models\Tenant;
use App\Services\ProcurementPolicyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class ProcurementPolicyTest extends TestCase
{
    use RefreshDatabase;
    public function test_default_threshold_boundaries_have_no_gap_or_overlap(): void
    {
        $tenant=Tenant::query()->create(['name'=>'Alpha','slug'=>'alpha']);$policy=app(ProcurementPolicyService::class);
        $this->assertSame(1,$policy->tierFor($tenant->id,99999)->required_quotes);
        $this->assertSame(2,$policy->tierFor($tenant->id,100000)->required_quotes);
        $this->assertSame(3,$policy->tierFor($tenant->id,1000000)->required_quotes);
        $this->assertSame(3,$policy->tierFor($tenant->id,100000000)->required_quotes);
        $this->assertSame(5,$policy->tierFor($tenant->id,100000001)->required_quotes);
    }
}
