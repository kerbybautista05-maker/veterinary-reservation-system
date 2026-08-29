<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';
                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) document.documentElement.classList.add('dark');
                }
            })();
        </script>

        <style>
            html {
                scroll-behavior: smooth;
                background-color: #ffffff;
                font-size: 15px;
                font-weight: 400;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            html.dark {
                background-color: #022c22;
            }

            ::-webkit-scrollbar {
                width: 10px;
            }

            ::-webkit-scrollbar-track {
                background: #f8fafc;
            }

            ::-webkit-scrollbar-thumb {
                background: #10b981;
                border-radius: 20px;
                border: 2px solid #f8fafc;
            }

            ::selection {
                background-color: #d1fae5;
                color: #065f46;
            }

            button, input, optgroup, select, textarea {
                font-weight: 500;
            }
        </style>

        <title inertia>{{ config('app.name', '') }}</title>

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
        

        <link rel="icon" type="image/png" sizes="16x16" href="/logo.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png">
        <link rel="icon" type="image/png" sizes="48x48" href="/logo.png">
        <link rel="icon" type="image/png" sizes="192x192" href="/logo.png">
        <link rel="icon" type="image/png" sizes="512x512" href="/logo.png">
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.png">
        <link rel="shortcut icon" href="/logo.png">

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="antialiased bg-white text-slate-700 font-normal text-[15px]" style="font-family: 'Poppins', sans-serif;">
        @inertia
    </body>
</html>