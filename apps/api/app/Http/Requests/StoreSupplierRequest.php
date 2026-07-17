<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupplierRequest extends FormRequest
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
        $supplierId = $this->route('supplier')?->id;

        return [
            'legal_name' => [$this->isMethod('POST') ? 'required' : 'sometimes', 'string', 'max:255'],
            'rccm' => ['nullable', 'string', 'max:100'],
            'niu' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('suppliers', 'niu')
                    ->where(fn ($query) => $query->where('tenant_id', app('tenant.id')))
                    ->ignore($supplierId),
            ],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string', 'max:40'],
            'contact_name' => ['nullable', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'country' => ['nullable', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:120'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'iban' => ['nullable', 'string', 'max:100'],
            'swift' => ['nullable', 'string', 'max:40'],
            'products' => ['nullable', 'array', 'max:100'],
            'products.*' => ['string', 'max:255'],
            'services' => ['nullable', 'array', 'max:100'],
            'services.*' => ['string', 'max:255'],
            'payment_terms_days' => ['nullable', 'integer', 'min:0', 'max:365'],
        ];
    }
}
