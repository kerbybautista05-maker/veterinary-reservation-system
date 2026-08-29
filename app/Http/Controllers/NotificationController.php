<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    // =========================================================================
    // index — list the authenticated user's notifications
    // GET /api/notifications?status=unread
    // =========================================================================

    public function index(Request $request)
    {
        try {
            $query = Notification::where('user_id', $request->user()->id);

            if ($request->input('status') === 'unread') {
                $query->unread();
            }
            if ($type = $request->input('type')) {
                $query->ofType($type);
            }

            $notifications = $query->orderByDesc('created_at')->paginate($request->input('per_page', 20));

            return response()->json([
                'success'       => true,
                'data'          => $notifications->items(),
                'unread_count'  => $request->user()->getUnreadNotificationsCount(),
                'pagination'    => [
                    'current_page' => $notifications->currentPage(),
                    'last_page'    => $notifications->lastPage(),
                    'per_page'     => $notifications->perPage(),
                    'total'        => $notifications->total(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching notifications: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve notifications', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // unreadCount — lightweight endpoint for badge counters
    // =========================================================================

    public function unreadCount(Request $request)
    {
        return response()->json([
            'success' => true,
            'count'   => $request->user()->getUnreadNotificationsCount(),
        ]);
    }

    // =========================================================================
    // markRead — mark a single notification as read
    // =========================================================================

    public function markRead(Request $request, $id)
    {
        try {
            $notification = Notification::where('user_id', $request->user()->id)->findOrFail($id);
            $notification->markAsRead();

            return response()->json(['success' => true, 'data' => $notification->fresh()]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Notification not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error marking notification read: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update notification', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // markAllRead
    // =========================================================================

    public function markAllRead(Request $request)
    {
        try {
            Notification::where('user_id', $request->user()->id)
                ->unread()
                ->update(['is_read' => true, 'read_at' => now()]);

            return response()->json(['success' => true, 'message' => 'All notifications marked as read.']);

        } catch (\Exception $e) {
            Log::error('Error marking all notifications read: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update notifications', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // destroy — remove a notification
    // =========================================================================

    public function destroy(Request $request, $id)
    {
        try {
            $notification = Notification::where('user_id', $request->user()->id)->findOrFail($id);
            $notification->delete();

            return response()->json(['success' => true, 'message' => 'Notification deleted.']);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Notification not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting notification: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete notification', 'error' => $e->getMessage()], 500);
        }
    }
}
