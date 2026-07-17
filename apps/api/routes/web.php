<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'name' => 'ProcuFlow API',
    'version' => '0.4.0',
    'status' => 'ok',
]));
