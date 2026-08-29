<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ActivityLogController extends Controller
{
    // =========================================================================
    // index — Admin views the system-wide audit trail
    // GET /api/activity-logs?user_id=&action=&subject_type=&date_from=&date_to=&search=
    // =========================================================================

    public function index(Request $request)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized: Admin access required.'], 403);
            }

            $query = ActivityLog::with('user');

            if ($userId = $request->input('user_id')) {
                $query->forUser($userId);
            }
            if ($action = $request->input('action')) {
                $query->action($action);
            }
            if ($subjectType = $request->input('subject_type')) {
                $query->where('subject_type', $subjectType);
            }
            if ($subjectId = $request->input('subject_id')) {
                $query->where('subject_id', $subjectId);
            }
            if ($from = $request->input('date_from')) {
                $query->whereDate('created_at', '>=', $from);
            }
            if ($to = $request->input('date_to')) {
                $query->whereDate('created_at', '<=', $to);
            }
            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('action', 'like', "%{$search}%")
                      ->orWhere('ip_address', 'like', "%{$search}%");
                });
            }

            $logs = $query->orderByDesc('created_at')->paginate($request->input('per_page', 25));

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
            Log::error('Error fetching activity logs: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve activity logs', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // show — view a single audit trail entry, including the diff
    // =========================================================================

    public function show(Request $request, $id)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized: Admin access required.'], 403);
            }

            $log = ActivityLog::with('user')->findOrFail($id);

            return response()->json(['success' => true, 'data' => $log]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Activity log entry not found'], 404);
        }
    }

    // =========================================================================
    // forSubject — audit history for a specific record (e.g. one appointment)
    // GET /api/activity-logs/subject?type=App\Models\Appointment&id=42
    // =========================================================================

    public function forSubject(Request $request)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized: Admin access required.'], 403);
            }

            $type = $request->input('type');
            $id   = $request->input('id');

            if (!$type || !$id) {
                return response()->json(['success' => false, 'message' => 'type and id are required.'], 422);
            }

            $logs = ActivityLog::with('user')
                ->forSubject($type, $id)
                ->orderByDesc('created_at')
                ->get();

            return response()->json(['success' => true, 'data' => $logs]);

        } catch (\Exception $e) {
            Log::error('Error fetching subject activity: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve activity', 'error' => $e->getMessage()], 500);
        }
    }
}
