<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class StoreRfqRequest extends FormRequest
{
    public function authorize(): bool { return in_array($this->user()?->roleForTenant(app('tenant.id')), ['owner','admin','buyer','procurement_manager'], true); }
    public function rules(): array { return ['purchase_request_id'=>['required','integer'],'title'=>['required','string','max:255'],'description'=>['nullable','string','max:5000'],'currency'=>['nullable','string','max:8'],'response_deadline'=>['required','date','after:now'],'delivery_location'=>['nullable','string','max:255'],'payment_terms'=>['nullable','string','max:3000'],'supplier_ids'=>['required','array','min:1','max:50'],'supplier_ids.*'=>['required','integer','distinct']]; }
}
