<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class OtpVerificationController extends Controller
{
    /**
     * Show OTP verification page
     */
    public function show(): Response|RedirectResponse
    {
        $user = Auth::user();

        // Redirect to login if not authenticated
        if (!$user) {
            return redirect()->route('login');
        }

        // Redirect if already verified
        if ($user->hasVerifiedEmail()) {
            return redirect()->route($user->role === 'admin' ? 'admin.dashboard' : 'user.dashboard');
        }

        // Calculate time remaining for resend
        $timeRemaining = $this->timeToNextResend($user);

        return Inertia::render('auth/verifyOtp', [
            'email' => $user->email,
            // Pass the time remaining in seconds. 0 means they can resend now.
            'canResend' => $timeRemaining, 
        ]);
    }

    /**
     * Verify the OTP
     */
    public function verify(Request $request): RedirectResponse
    {
        $user = Auth::user();

        // Redirect to login if not authenticated
        if (!$user) {
            return redirect()->route('login')->withErrors(['otp' => 'Session expired. Please login again.']);
        }

        $request->validate([
            'otp' => 'required|string|size:6',
        ]);

        // Check if OTP is valid
        if (!$user->otp_code) {
            return back()->withErrors(['otp' => 'No OTP found. Please request a new one.']);
        }

        // Check if OTP has expired
        if (now()->isAfter($user->otp_expires_at)) {
            return back()->withErrors(['otp' => 'OTP has expired. Please request a new one.']);
        }

        // Check if OTP matches
        if ($request->otp !== $user->otp_code) {
            return back()->withErrors(['otp' => 'Invalid OTP. Please try again.']);
        }

        // Mark email as verified
        $user->update([
            'email_verified_at' => now(),
            'otp_code' => null,
            'otp_expires_at' => null,
        ]);

        // Redirect based on user role
        $redirectRoute = $user->role === 'admin' ? 'admin.dashboard' : 'user.dashboard';

        return redirect()->route($redirectRoute)->with('status', 'Email verified successfully!');
    }

    /**
     * Resend OTP
     */
    public function resend(Request $request): RedirectResponse
    {
        $user = Auth::user();

        // Redirect to login if not authenticated
        if (!$user) {
            return redirect()->route('login')->withErrors(['otp' => 'Session expired. Please login again.']);
        }

        // Check if user is already verified
        if ($user->hasVerifiedEmail()) {
            return redirect()->route($user->role === 'admin' ? 'admin.dashboard' : 'user.dashboard');
        }

        // Rate limiting: check if last OTP was sent within 2 minutes
        if ($this->timeToNextResend($user) > 0) {
            return back()->withErrors(['otp' => 'Please wait before requesting another OTP.']);
        }

        // Generate and send new OTP
        $this->generateAndSendOtp($user);

        return back()->with('status', 'A new OTP has been sent to your email.');
    }

    /**
     * Calculate seconds remaining until the user can resend OTP (2 minute cooldown)
     * Returns 0 if resend is allowed.
     */
    protected function timeToNextResend(User $user): int
    {
        // 10 minutes is the OTP expiry, 2 minutes is the cooldown
        $cooldownMinutes = 2; 

        if (!$user->otp_expires_at) {
            return 0;
        }

        /** @var Carbon $otpExpiry */
        $otpExpiry = $user->otp_expires_at;
        // The creation time is 10 minutes before the expiration time.
        $otpCreationTime = $otpExpiry->copy()->subMinutes(10);
        // The time they can resend is the creation time + cooldown period (2 minutes).
        $nextResendTime = $otpCreationTime->addMinutes($cooldownMinutes);

        if (now()->isBefore($nextResendTime)) {
            // Cooldown is still active
            return now()->diffInSeconds($nextResendTime);
        }

        return 0;
    }

    /**
     * Generate and send OTP
     */
    protected function generateAndSendOtp(User $user): void
    {
        // Generate 6-digit OTP
        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Store OTP in database (expires in 10 minutes)
        $user->update([
            'otp_code' => $otp,
            'otp_expires_at' => now()->addMinutes(10),
        ]);

        // Send OTP via email
        try {
            Mail::send('emails.otp', ['otp' => $otp, 'user' => $user], function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('Verify Your Email - ' . config('app.name'));
            });
        } catch (\Exception $e) {
            // Log the error but don't expose it to user
            \Log::error('Failed to send OTP email: ' . $e->getMessage());
            
            // Optionally, you could throw an exception or handle it differently
            // For now, we'll silently fail and the user can request a new OTP
        }
    }
}