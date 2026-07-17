<?php

use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', 'AuthController@login');
    Route::post('/auth/logout', 'AuthController@logout')->middleware('auth:sanctum');
    Route::get('/me', 'MeController@show')->middleware('auth:sanctum');

    Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
        Route::apiResource('suppliers', 'SupplierController');
        Route::post('suppliers/{supplier}/submit', 'SupplierWorkflowController@submit');
        Route::post('suppliers/{supplier}/approve', 'SupplierWorkflowController@approve');
        Route::post('suppliers/{supplier}/reject', 'SupplierWorkflowController@reject');
        Route::post('suppliers/{supplier}/documents', 'SupplierDocumentController@store');
        Route::post('suppliers/{supplier}/evaluations', 'SupplierEvaluationController@store');

        Route::apiResource('acde-needs', 'AcdeNeedController');
        Route::post('acde-needs/{need}/generate-purchase-request', 'AcdeConversionController@purchaseRequest');
        Route::post('acde-needs/{need}/generate-rfq', 'AcdeConversionController@rfq');

        Route::apiResource('purchase-requests', 'PurchaseRequestController');
        Route::post('purchase-requests/{request}/submit', 'PurchaseRequestWorkflowController@submit');
        Route::post('purchase-requests/{request}/approve', 'PurchaseRequestWorkflowController@approve');
        Route::post('purchase-requests/{request}/reject', 'PurchaseRequestWorkflowController@reject');

        Route::apiResource('rfqs', 'RfqController');
        Route::post('rfqs/{rfq}/send', 'RfqWorkflowController@send');
        Route::post('rfqs/{rfq}/close', 'RfqWorkflowController@close');
        Route::get('rfqs/{rfq}/compare', 'RfqComparisonController@show');

        Route::apiResource('purchase-orders', 'PurchaseOrderController');
        Route::get('purchase-orders/{order}/pdf', 'PurchaseOrderPdfController@show');

        Route::apiResource('deliveries', 'DeliveryController');
        Route::apiResource('invoices', 'InvoiceController');
        Route::get('dashboard', 'DashboardController@show');
        Route::get('audit-logs', 'AuditLogController@index');
    });

    Route::post('/payments/dohone/start', 'DohonePaymentController@start')->middleware('auth:sanctum');
    Route::get('/payments/dohone/notify', 'DohoneWebhookController@notify');
});

