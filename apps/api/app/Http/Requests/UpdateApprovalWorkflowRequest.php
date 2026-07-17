<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateApprovalWorkflowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array(
            $this->user()?->roleForTenant(app('tenant.id')),
            ['owner', 'admin'],
            true
        );
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'steps' => ['required', 'array', 'min:1', 'max:10'],
            'steps.*.role' => [
                'required',
                Rule::in(['manager', 'buyer', 'procurement_manager', 'controller', 'finance', 'director']),
            ],
            'steps.*.minimum_amount' => ['required', 'integer', 'min:0'],
            'steps.*.maximum_amount' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            foreach ($this->input('steps', []) as $index => $step) {
                $minimum = (int) ($step['minimum_amount'] ?? 0);
                $maximum = $step['maximum_amount'] ?? null;

                if ($maximum !== null && (int) $maximum < $minimum) {
                    $validator->errors()->add(
                        "steps.{$index}.maximum_amount",
                        'Le montant maximum doit etre superieur ou egal au minimum.'
                    );
                }
            }
        }];
    }
}
