<?php

return [
    'trial_days' => 14,
    'default' => 'growth',
    'catalog' => [
        'starter' => [
            'name' => 'Essentiel',
            'description' => 'Pour structurer les premiers processus achats.',
            'monthly_price' => 25000,
            'yearly_price' => 250000,
            'limits' => ['users' => 3, 'suppliers' => 50, 'storage_gb' => 2],
            'features' => ['Demandes et validations', 'Fournisseurs et contrats', 'Commandes, livraisons et factures'],
        ],
        'growth' => [
            'name' => 'Performance',
            'description' => 'Pour une direction Achats en croissance.',
            'monthly_price' => 75000,
            'yearly_price' => 750000,
            'limits' => ['users' => 15, 'suppliers' => 500, 'storage_gb' => 20],
            'features' => ['Tout Essentiel', 'RFQ et comparaison multicritere', 'Automatisations et reporting LEAN'],
        ],
        'enterprise' => [
            'name' => 'Entreprise',
            'description' => 'Pour les groupes et organisations multi-entites.',
            'monthly_price' => 200000,
            'yearly_price' => 2000000,
            'limits' => ['users' => null, 'suppliers' => null, 'storage_gb' => 100],
            'features' => ['Tout Performance', 'Utilisateurs illimites', 'Accompagnement et integrations API'],
        ],
    ],
];
