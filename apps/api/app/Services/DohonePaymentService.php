<?php

namespace App\Services;

class DohonePaymentService
{
    public function assertConfiguration(string $notifyUrl): void
    {
        $values = [
            'code marchand' => config('services.dohone.merchant_code'),
            'code de hachage' => config('services.dohone.hash_code'),
            'URL de paiement' => config('services.dohone.payment_url'),
            'URL de notification' => $notifyUrl,
            'URL de succes' => config('services.dohone.success_url'),
            'URL d annulation' => config('services.dohone.cancel_url'),
        ];
        foreach ($values as $label => $value) abort_unless(is_string($value) && $value !== '', 503, "Configuration DOHONE incomplete : {$label}.");
        foreach (['URL de paiement', 'URL de notification', 'URL de succes', 'URL d annulation'] as $label) {
            $url = $values[$label];
            abort_unless(filter_var($url, FILTER_VALIDATE_URL), 503, "Configuration DOHONE invalide : {$label}.");
            if (app()->environment('production')) {
                abort_unless(str_starts_with($url, 'https://'), 503, "Configuration DOHONE non securisee : {$label} doit utiliser HTTPS.");
                abort_if(in_array(parse_url($url, PHP_URL_HOST), ['localhost', '127.0.0.1'], true), 503, "Configuration DOHONE invalide : {$label} doit etre publique.");
            }
        }
    }

    public function buildPaymentPayload(array $payload): array
    {
        return array_filter([
            'cmd' => 'start',
            'rH' => config('services.dohone.merchant_code'),
            'rI' => $payload['reference'] ?? null,
            'rMt' => $payload['amount'] ?? null,
            'rDvs' => $payload['currency'] ?? 'XAF',
            'source' => 'ProcuFlow Africa',
            'rT' => $payload['phone'] ?? null,
            'rN' => $payload['name'] ?? null,
            'rE' => $payload['email'] ?? null,
            'motif' => $payload['motif'] ?? null,
            'rLocale' => 'fr',
            'numberNotifs' => 5,
            'notifyPage' => $payload['notify_page'] ?? config('services.dohone.notify_url'),
            'endPage' => config('services.dohone.success_url'),
            'cancelPage' => config('services.dohone.cancel_url'),
        ], fn ($value) => $value !== null && $value !== '');
    }

    public function verifyNotification(array $query): bool
    {
        if (! is_string(config('services.dohone.hash_code')) || config('services.dohone.hash_code') === '') return false;
        foreach (['idReqDoh', 'rI', 'rMt', 'rDvs', 'rH', 'mode', 'hash'] as $key) {
            if (! isset($query[$key]) || ! is_scalar($query[$key])) return false;
        }
        $expected = md5(
            (string) $query['idReqDoh'] .
            (string) $query['rI'] .
            (string) $query['rMt'] .
            config('services.dohone.hash_code')
        );

        return hash_equals($expected, (string) $query['hash']);
    }
}
