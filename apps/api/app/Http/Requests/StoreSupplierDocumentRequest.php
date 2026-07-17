<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupplierDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array(
            $this->user()?->roleForTenant(app('tenant.id')),
            ['owner', 'admin', 'buyer', 'procurement_manager'],
            true
        );
    }

    public function rules(): array
    {
        return [
            'document_type' => [
                'required',
                Rule::in(['rccm', 'niu', 'tax_certificate', 'insurance', 'approval', 'other']),
            ],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'expires_at' => ['nullable', 'date', 'after:today'],
        ];
    }
}
