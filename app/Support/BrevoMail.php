<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Sends branded HTML emails through the Brevo (Sendinblue) HTTP API.
 *
 * Single send path for every system email in the app — account status,
 * payments, appointments, OTP, registrations, reminders, etc. Config is
 * read from .env (BREVO_API_KEY / BREVO_SENDER_NAME / BREVO_SENDER_EMAIL).
 *
 * Never throws — it logs failures and returns false so callers can fail
 * gracefully (the web request still succeeds).
 */
class BrevoMail
{
    public static function send(string $toEmail, ?string $toName, string $subject, string $html): bool
    {
        if (!$toEmail) {
            return false;
        }

        $apiKey = env('BREVO_API_KEY');
        if (!$apiKey) {
            Log::warning('BrevoMail: BREVO_API_KEY is not set — email "' . $subject . '" to ' . $toEmail . ' was not sent.');
            return false;
        }

        try {
            $response = Http::withHeaders([
                'api-key'      => $apiKey,
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ])->post('https://api.brevo.com/v3/smtp/email', [
                'sender' => [
                    'name'  => env('BREVO_SENDER_NAME', 'NE Veterinary Clinic'),
                    'email' => env('BREVO_SENDER_EMAIL'),
                ],
                'to' => [
                    ['email' => $toEmail, 'name' => $toName],
                ],
                'subject'     => $subject,
                'htmlContent' => $html,
            ]);

            if (!$response->successful()) {
                Log::error('BrevoMail send failed', [
                    'to'      => $toEmail,
                    'subject' => $subject,
                    'status'  => $response->status(),
                    'body'    => $response->body(),
                ]);
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::warning('BrevoMail: failed to send to ' . $toEmail . ' — ' . $e->getMessage());
            return false;
        }
    }
}