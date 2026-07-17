<?php

return [
    'dohone' => [
        'merchant_code' => env('DOHONE_MERCHANT_CODE'),
        'hash_code' => env('DOHONE_HASH_CODE'),
        'payment_url' => env('DOHONE_PAYMENT_URL', 'https://www.my-dohone.com/dohone/pay'),
        'notify_url' => env('DOHONE_NOTIFY_URL'),
        'success_url' => env('DOHONE_SUCCESS_URL'),
        'cancel_url' => env('DOHONE_CANCEL_URL'),
    ],
];

