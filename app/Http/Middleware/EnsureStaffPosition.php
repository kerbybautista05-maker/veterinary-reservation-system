<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts route access by `position` for staff-role users.
 *
 * Usage in routes:
 *   ->middleware('position.only:Hiring Manager')     — ONLY these position(s) may pass
 *   ->middleware('position.except:Hiring Manager')   — these position(s) are BLOCKED
 *
 * Multiple positions can be comma-separated:
 *   ->middleware('position.only:Hiring Manager,Operations Manager')
 *
 * Non-staff roles (admin, team_leader, teacher) are never affected — this only
 * gates staff-role users, since `position` is a staff-specific sub-classification.
 */
class EnsureStaffPosition
{
    public function handle(Request $request, Closure $next, string $mode, string $positions): Response
    {
        $user = $request->user();

        // Not logged in, or not a staff-role user — let the normal `auth`
        // middleware / role-based guards handle it, this middleware is a no-op.
        if (!$user || $user->role !== 'staff') {
            return $next($request);
        }

        $allowedPositions = array_map('trim', explode(',', $positions));
        $matches = in_array($user->position, $allowedPositions, true);

        $blocked = match ($mode) {
            'only'   => !$matches, // must match to pass
            'except' => $matches,  // must NOT match to pass
            default  => false,
        };

        if ($blocked) {
            abort(403, 'You do not have access to this page.');
        }

        return $next($request);
    }
}