<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePurchaseRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->roleForTenant(app('tenant.id')) !== null;
    }

    public function rules(): array
    {
        $partial = $this->isMethod('PATCH');
        $presence = $partial ? 'sometimes' : 'required';

        return [
            'title' => [$presence, 'string', 'max:255'],
            'acde_need_id' => ['nullable', 'integer'],
            'service' => [$presence, 'string', 'max:120'],
            'cost_center' => ['nullable', 'string', 'max:120'],
            'project' => ['nullable', 'string', 'max:120'],
            'priority' => [$presence, Rule::in(['low', 'normal', 'high', 'urgent'])],
            'reason' => [$presence, 'string', 'max:5000'],
            'needed_at' => ['nullable', 'date', 'after_or_equal:today'],
            'delivery_location' => ['nullable', 'string', 'max:255'],
            'currency' => ['nullable', 'string', 'max:8'],
            'action' => ['nullable', Rule::in(['draft', 'submit'])],
            'items' => [$presence, 'array', 'min:1', 'max:100'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit' => ['required', 'string', 'max:40'],
            'items.*.estimated_unit_price' => ['nullable', 'integer', 'min:0'],
            'items.*.specifications' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
