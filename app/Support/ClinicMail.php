<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Shared branded HTML email sender for system-generated notifications
 * (payments, appointment status changes, medical records, health reminders,
 * etc). Called internally by Notification::notify() whenever a notification's
 * channel is 'email' or 'both' — see Notification::shouldSendEmail().
 *
 * This keeps ONE email template and ONE send path instead of every
 * controller building its own HTML string, so "should this event email
 * someone" is controlled entirely by the $channel argument each controller
 * already passes to Notification::notify() — no controller needs to know
 * how email sending works.
 */
class ClinicMail
{
    private const NAVY = '#0B2545';
    private const BLUE = '#1D6FA5';
    private const BG   = '#F5F8FB';

    /**
     * @return bool true if the email was handed off to the mailer successfully
     */
    public static function send(
        User $user,
        string $subject,
        string $title,
        string $bodyText,
        ?string $ctaLabel = null,
        ?string $ctaUrl = null
    ): bool {
        if (!$user->email) {
            return false;
        }

        try {
            $html = self::buildHtml($title, $bodyText, $ctaLabel, $ctaUrl);
            $name = $user->full_name ?? $user->name ?? $user->email;

            Mail::html($html, function ($message) use ($user, $name, $subject) {
                $message->to($user->email, $name)->subject($subject);
            });

            return true;
        } catch (\Exception $e) {
            Log::warning('ClinicMail: failed to send to user #' . $user->id . ' — ' . $e->getMessage());
            return false;
        }
    }

    private static function buildHtml(string $title, string $bodyText, ?string $ctaLabel, ?string $ctaUrl): string
    {
        $navy = self::NAVY;
        $blue = self::BLUE;
        $bg   = self::BG;
        $year = date('Y');

        $safeBody = nl2br(e($bodyText));

        $cta = '';
        if ($ctaLabel && $ctaUrl) {
            $safeCtaLabel = e($ctaLabel);
            $cta = <<<HTML
<div style="text-align:center;margin:28px 0;">
  <a href="{$ctaUrl}" style="display:inline-block;background:{$navy};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:12px;">{$safeCtaLabel} &rarr;</a>
</div>
HTML;
        }

        $safeTitle = e($title);

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{$safeTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:{$bg};font-family:'Segoe UI',Arial,sans-serif;">
  <div style="background-color:{$bg};padding:32px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(11,37,69,0.10);">
      <div style="background-color:{$navy};padding:28px 36px 24px;text-align:center;">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#7FB3D9;margin-bottom:6px;">NE Veterinary Clinic</div>
        <div style="font-size:20px;font-weight:900;color:#ffffff;letter-spacing:-0.3px;line-height:1.2;">{$safeTitle}</div>
      </div>
      <div style="height:4px;background-color:{$blue};"></div>
      <div style="padding:32px 36px;">
        <p style="font-size:14px;color:#374151;line-height:1.75;margin:0;">{$safeBody}</p>
        {$cta}
      </div>
      <div style="background:#F8FAFB;border-top:1px solid #E5E7EB;padding:20px 36px;text-align:center;">
        <div style="font-size:12px;font-weight:800;color:{$navy};margin-bottom:4px;">NE Veterinary Clinic</div>
        <div style="font-size:10px;color:#B8C2CC;margin-top:8px;">&copy; {$year} NE Veterinary Clinic. All rights reserved.</div>
      </div>
    </div>
  </div>
</body>
</html>
HTML;
    }
}
