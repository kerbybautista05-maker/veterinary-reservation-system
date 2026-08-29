<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\LoginLog;
use App\Models\User;
use App\Support\ResolvesDashboardRoute;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    use ResolvesDashboardRoute;

    public function create(Request $request): Response|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->intended($this->dashboardRouteFor(Auth::user()));
        }

        return Inertia::render('auth/login', [
            'status' => session('status'),
            'canResetPassword' => true,
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::user();

        // Block deactivated accounts
        if (!$user->is_active) {
            $this->rejectSession($request, $user->email);

            return back()->withErrors([
                'email' => 'Your account has been deactivated. Please contact the clinic administrator.',
            ]);
        }

        // Block Pet Owner accounts still awaiting admin approval
        if ($user->isPendingApproval()) {
            $this->rejectSession($request, $user->email);

            return back()->withErrors([
                'email' => 'Your account is still pending admin approval. You will receive an email once approved.',
            ]);
        }

        // Block Pet Owner accounts that were declined
        if ($user->isRejected()) {
            $this->rejectSession($request, $user->email);

            return back()->withErrors([
                'email' => 'Your account application was declined. Please contact the clinic for details.',
            ]);
        }

        LoginLog::recordSuccess($user, $request->ip(), $request->userAgent());

        return redirect()->intended($this->dashboardRouteFor($user));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * Log the blocked user back out, invalidate the session, and record the
     * attempt as a failed login (account exists but is not allowed in yet).
     */
    private function rejectSession(Request $request, ?string $email): void
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        LoginLog::recordFailure($email ?? '', $request->ip(), $request->userAgent());
    }
}