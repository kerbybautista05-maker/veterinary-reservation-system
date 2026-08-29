<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\ChatConversation;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChatConversationController extends Controller
{
    // =========================================================================
    // index — Pet Owner sees own conversation(s); Admin sees all / unassigned
    // GET /api/chat/conversations?status=&unassigned=
    // =========================================================================

    public function index(Request $request)
    {
        try {
            $user  = $request->user();
            $query = ChatConversation::with(['owner', 'admin', 'latestMessage']);

            if ($user->isPetOwner()) {
                $query->where('owner_id', $user->id);
            } elseif ($user->isAdmin()) {
                if ($request->boolean('unassigned')) {
                    $query->unassigned();
                } elseif ($request->boolean('mine')) {
                    $query->forAdmin($user->id);
                }
            } else {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            if ($status = $request->input('status')) {
                $query->where('status', $status);
            }

            $conversations = $query->orderByDesc('last_message_at')->paginate($request->input('per_page', 15));

            $conversations->getCollection()->each(function (ChatConversation $c) use ($user) {
                $c->unread_count = $c->getUnreadCountFor($user);
            });

            return response()->json([
                'success'    => true,
                'data'       => $conversations->items(),
                'pagination' => [
                    'current_page' => $conversations->currentPage(),
                    'last_page'    => $conversations->lastPage(),
                    'per_page'     => $conversations->perPage(),
                    'total'        => $conversations->total(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching chat conversations: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve conversations', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // store — Pet Owner starts a new conversation (or reuses an open one)
    // =========================================================================

    public function store(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user->isPetOwner()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized: Pet Owner access required.'], 403);
            }

            $existing = ChatConversation::where('owner_id', $user->id)->open()->first();
            if ($existing) {
                return response()->json(['success' => true, 'data' => $existing->load(['owner', 'admin'])]);
            }

            $conversation = ChatConversation::create([
                'owner_id' => $user->id,
                'status'   => ChatConversation::STATUS_OPEN,
            ]);

            ActivityLog::record($user, 'started_chat_conversation', $conversation);

            return response()->json([
                'success' => true,
                'data'    => $conversation->load(['owner', 'admin']),
                'message' => 'Conversation started.',
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error starting conversation: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to start conversation', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // show
    // =========================================================================

    public function show(Request $request, $id)
    {
        try {
            $conversation = ChatConversation::with(['owner', 'admin', 'messages.sender'])->findOrFail($id);
            $user         = $request->user();

            if (!$user->isAdmin() && $conversation->owner_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $conversation->markReadFor($user);

            return response()->json(['success' => true, 'data' => $conversation]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Conversation not found'], 404);
        }
    }

    // =========================================================================
    // assign — Admin assigns themselves to a conversation
    // =========================================================================

    public function assign(Request $request, $id)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $conversation = ChatConversation::findOrFail($id);
            $conversation->assignAdmin($request->user());

            ActivityLog::record($request->user(), 'assigned_chat_conversation', $conversation);

            Notification::notify(
                $conversation->owner,
                'Support Agent Assigned',
                'An administrator has joined your chat.',
                Notification::TYPE_GENERAL,
                Notification::CHANNEL_APP,
                "/chat/{$conversation->id}"
            );

            return response()->json([
                'success' => true,
                'data'    => $conversation->fresh(['owner', 'admin']),
                'message' => 'Conversation assigned.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Conversation not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error assigning conversation: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to assign conversation', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // close
    // =========================================================================

    public function close(Request $request, $id)
    {
        try {
            $conversation = ChatConversation::findOrFail($id);
            $user         = $request->user();

            if (!$user->isAdmin() && $conversation->owner_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $conversation->close();
            ActivityLog::record($user, 'closed_chat_conversation', $conversation);

            return response()->json([
                'success' => true,
                'data'    => $conversation->fresh(),
                'message' => 'Conversation closed.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Conversation not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error closing conversation: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to close conversation', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // reopen
    // =========================================================================

    public function reopen(Request $request, $id)
    {
        try {
            $conversation = ChatConversation::findOrFail($id);
            $user         = $request->user();

            if (!$user->isAdmin() && $conversation->owner_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $conversation->reopen();
            ActivityLog::record($user, 'reopened_chat_conversation', $conversation);

            return response()->json([
                'success' => true,
                'data'    => $conversation->fresh(),
                'message' => 'Conversation reopened.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Conversation not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error reopening conversation: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to reopen conversation', 'error' => $e->getMessage()], 500);
        }
    }
}
