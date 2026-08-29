<?php

namespace App\Http\Middleware;

use App\Support\ResolvesDashboardRoute;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Default Laravel behavior of this middleware redirects an already-
 * authenticated user to route('dashboard') when they hit a `guest`-only
 * route (like /login). Problem: this app has NO route named 'dashboard' —
 * dashboards are role-scoped (admin.dashboard, staff.dashboard, etc).
 *
 * So kapag may stale/active session pa ang user (halimbawa isinara lang
 * niya yung tab imbes na mag-logout ng maayos), tapos binalikan niya
 * yung /login page — dito papasok muna ang middleware na 'to BAGO pa man
 * maabot ang AuthenticatedSessionController::create(). Kung susubukan
 * niyang gumawa ng route('dashboard') na wala namang ganung named route,
 * mag-e-error ito (RouteNotFoundException), kaya sira/hindi
 * interactive ang /login page — 'yun yung "hindi ma-click" na
 * nangyayari.
 *
 * Fix: gamitin dito rin ang parehong role-based dashboard resolver na
 * ginagamit sa AuthenticatedSessionController, para consistent at hindi
 * na tatamaan ng missing-route error.
 */
class RedirectIfAuthenticated
{
    use ResolvesDashboardRoute;

    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                return redirect($this->dashboardRouteFor(Auth::guard($guard)->user()));
            }
        }

        return $next($request);
    }
}
