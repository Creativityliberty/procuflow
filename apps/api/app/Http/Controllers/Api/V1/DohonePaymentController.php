<?php

namespace App\Http\Controllers\Api\V1;

class DohonePaymentController
{
    public function start(): never
    {
        abort(410, 'Cette ancienne route est desactivee. Utilisez le checkout securise de l abonnement.');
    }

    public function notify(): never
    {
        abort(410, 'Cette ancienne notification est desactivee.');
    }
}
