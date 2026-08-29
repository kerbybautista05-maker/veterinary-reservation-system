<?php

namespace App\Http\Controllers;

use App\Models\LoginLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LoginLogController extends Controller
{
    // =========================================================================
    // index — Admin views login attempt history
    // GET /api/login-logs?status=&user_id=&ip=&date_from=&date_to=
    // =========================================================================

    public function index(Request $request)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized: Admin access required.'], 403);
            }

            $query = LoginLog::with('user');

            if ($status = $request->input('status')) {
                $status === 'success' ? $query->successful() : $query->failed();
            }
            if ($userId = $request->input('user_id')) {
                $query->forUser($userId);
            }
            if ($ip = $request->input('ip')) {
                $query->fromIp($ip);
            }
            if ($email = $request->input('email')) {
                $query->where('email', 'like', "%{$email}%");
            }
            if ($from = $request->input('date_from')) {
                $query->whereDate('logged_in_at', '>=', $from);
            }
            if ($to = $request->input('date_to')) {
                $query->whereDate('logged_in_at', '<=', $to);
            }

            $logs = $query->orderByDesc('logged_in_at')->paginate($request->input('per_page', 25));

            return response()->json([
                'success'    => true,
                'data'       => $logs->items(),
                'pagination' => [
                    'current_page' => $logs->currentPage(),
                    'last_page'    => $logs->lastPage(),
                    'per_page'     => $logs->perPage(),
                    'total'        => $logs->total(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching login logs: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve login logs', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // show
    // =========================================================================

    public function show(Request $request, $id)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized: Admin access required.'], 403);
            }

            $log = LoginLog::with('user')->findOrFail($id);

            return response()->json(['success' => true, 'data' => $log]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Login log entry not found'], 404);
        }
    }

    // =========================================================================
    // recentFailedAttempts — check brute-force attempts for an email
    // GET /api/login-logs/failed-attempts?email=someone@example.com&minutes=15
    // =========================================================================

    public function recentFailedAttempts(Request $request)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized: Admin access required.'], 403);
            }

            $email   = $request->input('email');
            $minutes = (int) $request->input('minutes', 15);

            if (!$email) {
                return response()->json(['success' => false, 'message' => 'email is required.'], 422);
            }

            $count = LoginLog::getRecentFailedAttempts($email, $minutes);

            return response()->json(['success' => true, 'data' => ['email' => $email, 'minutes' => $minutes, 'failed_attempts' => $count]]);

        } catch (\Exception $e) {
            Log::error('Error checking failed attempts: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to check attempts', 'error' => $e->getMessage()], 500);
        }
    }
}
