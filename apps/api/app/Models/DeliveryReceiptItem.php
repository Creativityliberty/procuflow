<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class DeliveryReceiptItem extends Model{protected $fillable=['delivery_item_id','quantity_received','observations'];protected function casts():array{return['quantity_received'=>'decimal:3'];}}
