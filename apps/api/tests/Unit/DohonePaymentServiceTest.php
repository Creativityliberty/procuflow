<?php

namespace Tests\Unit;

use App\Services\DohonePaymentService;
use Tests\TestCase;

class DohonePaymentServiceTest extends TestCase
{
    public function test_it_rejects_invalid_hash(): void
    {
        config(['services.dohone.hash_code' => 'secret-demo-hash']);

        $service = new DohonePaymentService();

        $this->assertFalse($service->verifyNotification([
            'idReqDoh' => '6154698745212458',
            'rI' => '1001',
            'rMt' => '3000',
            'hash' => 'invalid',
        ]));
    }
}
