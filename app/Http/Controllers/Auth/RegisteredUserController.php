<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Public self-registration for Pet Owners.
 * Veterinarian and Admin accounts are created by an Admin (see UserController::store)
 * and do not go through this flow.
 */
class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    public function store(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'first_name'      => ['required', 'string', 'max:100'],
            'last_name'       => ['required', 'string', 'max:100'],
            'middle_name'     => ['nullable', 'string', 'max:100'],
            'suffix'          => ['nullable', 'string', 'max:20'],
            'email'           => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone_number'    => ['nullable', 'string', 'max:30', 'regex:/^[0-9+\-\s()]{7,20}$/'],
            'address'         => ['nullable', 'string'],
            'password'        => ['required', 'confirmed', Rules\Password::min(8)->letters()->numbers()],
            'terms_accepted'  => ['required', 'accepted'],
        ], [
            'email.unique'             => 'This email is already registered.',
            'terms_accepted.accepted'  => 'You must accept the terms to continue.',
        ]);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->withInput($request->except('password', 'password_confirmation'));
        }

        DB::beginTransaction();

        try {
            $user = User::create([
                'first_name'      => $request->first_name,
                'last_name'       => $request->last_name,
                'middle_name'     => $request->middle_name,
                'suffix'          => $request->suffix,
                'email'           => $request->email,
                'phone_number'    => $request->phone_number,
                'address'         => $request->address,
                'password'        => Hash::make($request->password),
                'role'            => User::ROLE_PET_OWNER,
                // New Pet Owner accounts start PENDING — an admin must approve the
                // account before the owner is allowed to log in.
                'approval_status' => User::APPROVAL_PENDING,
                'is_active'       => true,
            ]);

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Pet Owner registration failed: ' . $e->getMessage());

            return back()
                ->withErrors(['email' => 'Registration failed. Please try again.'])
                ->withInput($request->except('password', 'password_confirmation'));
        }

        event(new Registered($user));

        // Do NOT auto-login — the account is pending until an admin approves it.
        $this->sendPendingApprovalEmail($user);
        $this->notifyAdminsOfNewRegistration($user);

        return redirect()->route('login')->with(
            'status',
            'Your account has been created and is pending admin approval. You will receive an email once your account is approved.'
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Email notifications
    // ─────────────────────────────────────────────────────────────────────────

    private function buildEmailHtml(string $title, string $bodyHtml, string $preheader = ''): string
    {
        $year = date('Y');

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{$title}</title>
  <style>
    body { margin:0; padding:0; background-color:#F0F4F1; font-family:'Segoe UI',Arial,sans-serif; }
    .email-wrapper { background-color:#F0F4F1; padding:32px 16px; }
    .email-container { max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(15,60,45,0.10); }
    .email-header { background-color:#0F3C2D; padding:32px 40px 28px; text-align:center; }
    .email-header-logo { font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#8FD9B6; margin-bottom:6px; }
    .email-header-title { font-size:22px; font-weight:900; color:#ffffff; margin:0; letter-spacing:-0.3px; line-height:1.2; }
    .gold-bar { height:4px; background-color:#8FD9B6; }
    .email-body { padding:36px 40px; }
    .greeting { font-size:16px; font-weight:700; color:#0F3C2D; margin:0 0 8px; }
    .lead { font-size:14px; color:#374151; line-height:1.7; margin:0 0 24px; }
    .status-badge { display:inline-block; padding:6px 18px; border-radius:99px; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:1px; margin-bottom:20px; }
    .badge-pending  { background:#FEF3C7; color:#92400E; }
    .info-card { background:#F8FAF9; border:1.5px solid #DCEFE4; border-radius:12px; padding:20px 24px; margin-bottom:24px; }
    .info-card-title { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:1.5px; color:#0F3C2D; margin:0 0 14px; }
    .info-row { display:table; width:100%; margin-bottom:10px; }
    .info-label { display:table-cell; font-size:11px; font-weight:700; color:#6B7280; text-transform:uppercase; letter-spacing:0.8px; width:38%; padding-right:12px; vertical-align:top; }
    .info-value { display:table-cell; font-size:14px; font-weight:600; color:#111827; vertical-align:top; }
    .cta-wrap { text-align:center; margin:28px 0; }
    .cta-btn { display:inline-block; background:#0F3C2D; color:#ffffff !important; text-decoration:none; font-size:14px; font-weight:700; padding:14px 36px; border-radius:12px; }
    .divider { border:none; border-top:1px solid #E5E7EB; margin:28px 0; }
    .email-footer { background:#F8FAF9; border-top:1px solid #E5E7EB; padding:24px 40px; text-align:center; }
    .footer-brand { font-size:12px; font-weight:800; color:#0F3C2D; margin-bottom:4px; }
    .footer-link { font-size:11px; color:#0F3C2D; text-decoration:none; }
    .footer-copy { font-size:10px; color:#D1D5DB; margin-top:12px; }
  </style>
</head>
<body>
  <span style="display:none;font-size:1px;color:#F0F4F1;max-height:0;max-width:0;opacity:0;overflow:hidden;">{$preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="email-header-logo">Pet Care Clinic</div>
        <div class="email-header-title">{$title}</div>
      </div>
      <div class="gold-bar"></div>
      <div class="email-body">{$bodyHtml}</div>
      <div class="email-footer">
        <div class="footer-brand">Pet Care Clinic</div>
        <a href="mailto:care@petcareclinic.example" class="footer-link">care@petcareclinic.example</a>
        <div class="footer-copy">&copy; {$year} Pet Care Clinic. All rights reserved.</div>
      </div>
    </div>
  </div>
</body>
</html>
HTML;
    }

    /**
     * Tell the newly registered Pet Owner their account is pending admin approval.
     */
    private function sendPendingApprovalEmail(User $user): void
    {
        if (!$user->email) return;

        $name = $user->full_name;

        $body = <<<HTML
<p class="greeting">Hello, {$name}!</p>
<p class="lead">
  Thank you for registering with <strong>Pet Care Clinic</strong>. Your account has been
  created successfully and is now <strong>pending admin approval</strong>.
</p>

<div style="text-align:center;margin-bottom:20px;">
  <span class="status-badge badge-pending">&#9203; Pending Approval</span>
</div>

<div class="info-card">
  <div class="info-card-title">Account Details</div>
  <div class="info-row" style="margin-bottom:0;">
    <div class="info-label">Email</div>
    <div class="info-value">{$user->email}</div>
  </div>
</div>

<p class="lead" style="margin-bottom:0;">
  An administrator will review your account shortly. You will receive another email
  as soon as your account is <strong>approved</strong> — only then will you be able to log in
  and start booking appointments for your pets.
</p>
HTML;

        $html = $this->buildEmailHtml(
            'Account Pending Approval',
            $body,
            'Your account has been created and is awaiting admin approval.'
        );

        try {
            Mail::html($html, fn ($m) =>
                $m->to($user->email, $name)->subject('Account Pending Approval — Pet Care Clinic')
            );
        } catch (\Exception $e) {
            Log::error('sendPendingApprovalEmail: ' . $e->getMessage());
        }
    }

    /**
     * Notify admins that a new Pet Owner account is awaiting approval.
     */
    private function notifyAdminsOfNewRegistration(User $user): void
    {
        $admins = User::admins()->whereNotNull('email')->get(['id', 'email', 'first_name', 'last_name']);
        if ($admins->isEmpty()) return;

        $name     = $user->full_name;
        $adminUrl = url('/admin/approvals');

        $body = <<<HTML
<p class="greeting">&#128276; New Pet Owner Registration</p>
<p class="lead">
  A new Pet Owner account has just registered and is awaiting your approval before they
  can log in and book appointments.
</p>

<div class="info-card">
  <div class="info-card-title">Applicant Details</div>
  <div class="info-row">
    <div class="info-label">Name</div>
    <div class="info-value">{$name}</div>
  </div>
  <div class="info-row" style="margin-bottom:0;">
    <div class="info-label">Email</div>
    <div class="info-value">{$user->email}</div>
  </div>
</div>

<div class="cta-wrap">
  <a href="{$adminUrl}" class="cta-btn">Review &amp; Approve Account &rarr;</a>
</div>
HTML;

        $html = $this->buildEmailHtml(
            'New Pet Owner Registration',
            $body,
            "{$name} just registered and needs approval."
        );

        foreach ($admins as $admin) {
            try {
                Mail::html($html, fn ($m) =>
                    $m->to($admin->email, trim($admin->first_name . ' ' . $admin->last_name))
                      ->subject("New Pet Owner Registration — {$name}")
                );
            } catch (\Exception $e) {
                Log::error('notifyAdminsOfNewRegistration: ' . $e->getMessage());
            }
        }
    }
}