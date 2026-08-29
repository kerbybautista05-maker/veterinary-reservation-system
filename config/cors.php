<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', '*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://mn2co-workinghub.website',
        'https://www.mn2co-workinghub.website',
        'http://127.0.0.1:8000',
        'http://localhost:8000'
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];