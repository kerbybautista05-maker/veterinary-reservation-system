<?php
// config/reverb.php
// Increase max_message_size so 50-racer RACE_START payloads (~20KB) are accepted.
// Default is 10KB which is too small for large race broadcasts.

return [

    'default' => env('REVERB_SERVER', 'reverb'),

    'servers' => [

        'reverb' => [
            'host'    => env('REVERB_HOST', '0.0.0.0'),
            'port'    => env('REVERB_PORT', 8080),
            'scheme'  => env('REVERB_SCHEME', 'http'),
            'options' => [
                'tls' => [],
            ],
            // ── Raise limits for large race payloads (50 racers ≈ 20 KB) ───
            'max_request_size'    => env('REVERB_MAX_REQUEST_SIZE', 512 * 1024),  // 512 KB
            'scaling'             => [
                'enabled' => env('REVERB_SCALING_ENABLED', false),
                'channel' => env('REVERB_SCALING_CHANNEL', 'reverb'),
            ],
            'pulse_ingest_interval' => env('REVERB_PULSE_INGEST_INTERVAL', 15),
        ],

    ],

    'apps' => [
        'provider' => 'config',
        'apps'     => [
            [
                'key'              => env('REVERB_APP_KEY', 'mn2-race-key'),
                'secret'           => env('REVERB_APP_SECRET', 'mn2-race-secret'),
                'app_id'           => env('REVERB_APP_ID', 'mn2-race'),
                'options'          => [
                    'host'     => env('REVERB_HOST', '127.0.0.1'),
                    'port'     => env('REVERB_PORT', 8080),
                    'scheme'   => env('REVERB_SCHEME', 'http'),
                    'useTLS'   => env('REVERB_SCHEME', 'http') === 'https',
                ],
                'allowed_origins'  => ['*'],
                'ping_interval'    => env('REVERB_APP_PING_INTERVAL', 60),
                'max_message_size' => env('REVERB_APP_MAX_MESSAGE_SIZE', 512 * 1024), // 512 KB
            ],
        ],
    ],

];