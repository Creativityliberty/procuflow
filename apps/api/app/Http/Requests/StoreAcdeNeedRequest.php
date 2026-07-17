<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAcdeNeedRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->roleForTenant(app('tenant.id')) !== null;
    }

    public function rules(): array
    {
        $partial = $this->isMethod('PATCH');

        return [
            'title' => [$partial ? 'sometimes' : 'required', 'string', 'max:255'],
            'context' => ['nullable', 'string'],
            'service' => ['nullable', 'string', 'max:120'],
            'needed_at' => ['nullable', 'date', 'after_or_equal:today'],
            'priority' => ['nullable', Rule::in(['low', 'normal', 'high', 'urgent'])],
            'budget_amount' => ['nullable', 'integer', 'min:0'],
            'currency' => ['nullable', Rule::in(['XAF', 'EUR', 'USD'])],
            'delivery_location' => ['nullable', 'string', 'max:255'],
            'items' => [$partial ? 'sometimes' : 'required', 'array', 'min:4', 'max:100'],
            'items.*.kind' => ['required_with:items', 'in:expectation,constraint,data,requirement'],
            'items.*.priority_level' => ['nullable', Rule::in(['mandatory', 'desired', 'comfort'])],
            'items.*.content' => ['required_with:items', 'string', 'max:10000'],
            'items.*.criterion' => ['nullable', 'string', 'max:255'],
            'items.*.target_value' => ['nullable', 'string', 'max:120'],
            'items.*.unit' => ['nullable', 'string', 'max:60'],
            'items.*.tolerance' => ['nullable', 'string', 'max:120'],
            'items.*.verification_method' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if (! $this->has('items')) {
                return;
            }

            $kinds = collect($this->input('items', []))->pluck('kind');

            foreach (['expectation', 'constraint', 'data', 'requirement'] as $kind) {
                if (! $kinds->contains($kind)) {
                    $validator->errors()->add('items', "La rubrique ACDE {$kind} est obligatoire.");
                }
            }
        }];
    }
}
