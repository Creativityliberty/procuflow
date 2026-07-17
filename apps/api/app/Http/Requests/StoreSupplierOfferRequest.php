<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class StoreSupplierOfferRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array { return ['currency'=>['required','string','max:8'],'transport_cost'=>['nullable','integer','min:0'],'insurance_cost'=>['nullable','integer','min:0'],'lead_time_days'=>['required','integer','min:0','max:3650'],'validity_days'=>['required','integer','min:1','max:3650'],'payment_terms'=>['nullable','string','max:3000'],'warranty'=>['nullable','string','max:3000'],'incoterm'=>['nullable','string','max:20'],'notes'=>['nullable','string','max:5000'],'items'=>['required','array','min:1','max:100'],'items.*.rfq_item_id'=>['required','integer','distinct'],'items.*.quantity'=>['required','numeric','gt:0'],'items.*.unit_price'=>['required','integer','min:0'],'items.*.discount_percent'=>['nullable','numeric','between:0,100'],'items.*.tax_percent'=>['nullable','numeric','between:0,100'],'items.*.is_compliant'=>['required','boolean'],'items.*.comment'=>['nullable','string','max:2000'],'requirements'=>['sometimes','array','max:200'],'requirements.*.rfq_requirement_id'=>['required','integer','distinct'],'requirements.*.status'=>['required','in:compliant,partial,non_compliant,not_applicable'],'requirements.*.response'=>['nullable','string','max:5000'],'requirements.*.evidence_reference'=>['nullable','string','max:255']]; }
}
