<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InformationRequestWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_buyer_publishes_rfi_and_supplier_submits_a_traceable_response(): void
    {
        Mail::fake();
        Storage::fake('private');
        $tenant=Tenant::query()->create(['name'=>'Alpha','slug'=>'alpha-rfi']);
        $user=User::query()->create(['name'=>'Acheteur','email'=>'buyer-rfi@test.dev','password'=>'password','current_tenant_id'=>$tenant->id]);
        $tenant->users()->attach($user,['role'=>'owner']);
        $supplier=Supplier::query()->create(['tenant_id'=>$tenant->id,'legal_name'=>'Maintenance Plus','niu'=>'NIU-RFI-1','email'=>'supplier-rfi@test.dev','category'=>'Maintenance','status'=>'active']);
        Sanctum::actingAs($user);
        $headers=['X-Tenant-ID'=>(string)$tenant->id];

        $created=$this->withHeaders($headers)->postJson('/api/v1/information-requests',[
            'subject'=>'Capacite de maintenance nationale',
            'description'=>'Merci de presenter vos agences, certifications et delais moyens d intervention.',
            'category'=>'Maintenance',
            'response_deadline'=>now()->addDays(7)->toIso8601String(),
            'supplier_ids'=>[$supplier->id],
        ])->assertCreated()->assertJsonPath('status','draft')->assertJsonCount(1,'suppliers');
        $id=$created->json('id');

        $this->withHeaders($headers)->post("/api/v1/information-requests/{$id}/documents",[
            'file'=>UploadedFile::fake()->create('questionnaire.pdf',100,'application/pdf'),
        ])->assertCreated();

        $published=$this->withHeaders($headers)->postJson("/api/v1/information-requests/{$id}/publish")
            ->assertOk()->assertJsonPath('status','published')->assertJsonCount(1,'portal_links');
        $token=Str::afterLast($published->json('portal_links.0.url'),'/');
        $this->assertSame(64,strlen($token));
        Mail::assertSentCount(1);

        $this->getJson("/api/v1/supplier-portal/information-requests/{$token}")
            ->assertOk()->assertJsonPath('invitation.status','viewed')->assertJsonPath('is_open',true);
        $this->post("/api/v1/supplier-portal/information-requests/{$token}/response",[
            'response'=>'Nous couvrons Douala, Yaounde et Bafoussam avec une astreinte disponible en permanence.',
            'file'=>UploadedFile::fake()->create('capacites.pdf',120,'application/pdf'),
        ],['Accept'=>'application/json'])->assertOk()->assertJsonPath('invitation.status','submitted');

        $this->withHeaders($headers)->getJson("/api/v1/information-requests/{$id}")
            ->assertOk()->assertJsonPath('suppliers.0.status','submitted')->assertJsonPath('suppliers.0.response_original_name','capacites.pdf');
        $this->withHeaders($headers)->postJson("/api/v1/information-requests/{$id}/close")
            ->assertOk()->assertJsonPath('status','closed');
        $this->getJson("/api/v1/supplier-portal/information-requests/{$token}")
            ->assertOk()->assertJsonPath('is_open',false);
    }
}
