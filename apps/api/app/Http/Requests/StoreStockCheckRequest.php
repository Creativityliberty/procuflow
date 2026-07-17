<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class StoreStockCheckRequest extends FormRequest
{
    public function authorize(): bool { return in_array($this->user()?->roleForTenant(app('tenant.id')), ['owner','admin','storekeeper','buyer'], true); }
    public function rules(): array { return ['notes'=>['nullable','string','max:3000'],'items'=>['required','array','min:1','max:100'],'items.*.purchase_request_item_id'=>['required','integer','distinct'],'items.*.available_quantity'=>['required','numeric','min:0'],'items.*.is_stock_item'=>['required','boolean'],'items.*.stock_location'=>['nullable','string','max:120'],'items.*.comment'=>['nullable','string','max:1000']]; }
}
