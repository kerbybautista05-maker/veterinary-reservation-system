<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── Daily reminders (appointments tomorrow, health reminders due soon, ──────
//    pending payments) — see App\Console\Commands\SendDailyReminders.
// Runs once a day at 8:00 AM Asia/Manila (matches APP_TIMEZONE in .env).
Schedule::command('reminders:send-daily')
    ->dailyAt('08:00')
    ->timezone(config('app.timezone'))
    ->withoutOverlapping()
    ->onFailure(function () {
        \Illuminate\Support\Facades\Log::error('reminders:send-daily failed to run.');
    });
