<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->roleForTenant(app('tenant.id')), ['owner', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'legal_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'rccm' => ['sometimes', 'nullable', 'string', 'max:100'],
            'niu' => ['sometimes', 'nullable', 'string', 'max:100'],
            'country' => ['sometimes', 'nullable', 'string', 'size:2'],
            'city' => ['sometimes', 'nullable', 'string', 'max:120'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'company_size' => ['sometimes', 'nullable', 'string', 'max:30'],
            'currency' => ['sometimes', 'string', 'max:8'],
            'rfq_threshold' => ['sometimes', 'integer', 'min:0'],
            'default_payment_days' => ['sometimes', 'integer', 'min:0', 'max:365'],
            'cost_center_required' => ['sometimes', 'boolean'],
            'complete_onboarding' => ['sometimes', 'boolean'],
        ];
    }
}
