<?php

namespace App\Http\Controllers;

use App\Models\PasswordResetCode;
use App\Models\User;
use App\Support\ClinicMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ForgotPasswordController extends Controller
{
    /**
     * Step 1: Send verification code to email.
     * POST /api/forgot-password/send-code
     */
    public function sendCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => 'No account found with that email address.',
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        // Invalidate any previous unused codes
        PasswordResetCode::where('user_id', $user->id)
            ->where('used', false)
            ->update(['used' => true]);

        // Generate 6-digit code
        $code = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        $resetCode = PasswordResetCode::create([
            'user_id'    => $user->id,
            'code'       => $code,
            'expires_at' => now()->addMinutes(10),
            'used'       => false,
        ]);

        // Send email
        $sent = ClinicMail::send(
            $user,
            'Password Reset Code',
            'Your Verification Code',
            "Your 6-digit verification code is:\n\n{$code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request a password reset, please ignore this email.",
        );

        if (!$sent) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send verification code. Please try again.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Verification code sent to your email.',
            'email'   => $user->email,
        ]);
    }

    /**
     * Step 2: Verify the 6-digit code.
     * POST /api/forgot-password/verify-code
     */
    public function verifyCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'code'  => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
                'message' => 'Invalid verification code.',
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        $resetCode = PasswordResetCode::where('user_id', $user->id)
            ->where('code', $request->code)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$resetCode) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired verification code.',
            ], 422);
        }

        // Mark code as used
        $resetCode->update(['used' => true]);

        // Generate a temporary token for the reset step
        $resetToken = Str::random(60);

        // Store token in cache (valid for 10 minutes)
        cache()->put("password_reset_token:{$request->email}", $resetToken, now()->addMinutes(10));

        return response()->json([
            'success' => true,
            'message' => 'Code verified successfully.',
            'token'   => $resetToken,
            'email'   => $request->email,
        ]);
    }

    /**
     * Step 3: Reset password.
     * POST /api/forgot-password/reset
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'             => 'required|email|exists:users,email',
            'token'             => 'required|string',
            'password'          => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $cachedToken = cache()->get("password_reset_token:{$request->email}");

        if (!$cachedToken || $cachedToken !== $request->token) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired reset session. Please start over.',
            ], 422);
        }

        $user = User::where('email', $request->email)->first();
        $user->update(['password' => Hash::make($request->password)]);

        // Invalidate the token
        cache()->forget("password_reset_token:{$request->email}");

        return response()->json([
            'success' => true,
            'message' => 'Password has been reset successfully.',
        ]);
    }
}
