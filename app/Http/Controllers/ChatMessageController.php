<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ChatMessageController extends Controller
{
    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private function authorizeConversation(Request $request, ChatConversation $conversation): bool
    {
        $user = $request->user();
        return $user->isAdmin() || $conversation->owner_id === $user->id;
    }

    // =========================================================================
    // index — list messages for a conversation
    // GET /api/chat/conversations/{conversationId}/messages
    // =========================================================================

    public function index(Request $request, $conversationId)
    {
        try {
            $conversation = ChatConversation::findOrFail($conversationId);
            if (!$this->authorizeConversation($request, $conversation)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $messages = $conversation->messages()
                ->with('sender')
                ->paginate($request->input('per_page', 30));

            $conversation->markReadFor($request->user());

            return response()->json([
                'success'    => true,
                'data'       => $messages->items(),
                'pagination' => [
                    'current_page' => $messages->currentPage(),
                    'last_page'    => $messages->lastPage(),
                    'per_page'     => $messages->perPage(),
                    'total'        => $messages->total(),
                ],
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Conversation not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching chat messages: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve messages', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // store — send a message in a conversation
    // =========================================================================

    public function store(Request $request, $conversationId)
    {
        try {
            $conversation = ChatConversation::findOrFail($conversationId);
            $user         = $request->user();

            if (!$this->authorizeConversation($request, $conversation)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }
            if ($conversation->status === ChatConversation::STATUS_CLOSED) {
                return response()->json(['success' => false, 'message' => 'This conversation is closed.'], 422);
            }

            $validator = Validator::make($request->all(), [
                'message'    => 'required_without:attachment|nullable|string|max:5000',
                'attachment' => 'nullable|file|max:10240',
            ]);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $data = [
                'conversation_id' => $conversation->id,
                'sender_id'       => $user->id,
                'message'         => $request->input('message'),
            ];

            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $data['attachment_path'] = $file->store('chat-attachments', 'public');
                $data['attachment_name'] = $file->getClientOriginalName();
            }

            $message = ChatMessage::create($data);

            // Auto-assign an admin conversation to the responding admin if unassigned
            if ($user->isAdmin() && !$conversation->admin_id) {
                $conversation->assignAdmin($user);
            }

            $recipient = $user->id === $conversation->owner_id ? $conversation->admin : $conversation->owner;
            if ($recipient) {
                Notification::notify(
                    $recipient,
                    'New Chat Message',
                    $message->message ? mb_substr($message->message, 0, 100) : 'Sent an attachment.',
                    Notification::TYPE_GENERAL,
                    Notification::CHANNEL_APP,
                    "/chat/{$conversation->id}"
                );
            }

            return response()->json([
                'success' => true,
                'data'    => $message->load('sender'),
                'message' => 'Message sent.',
            ], 201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Conversation not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error sending chat message: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to send message', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // markRead — mark all unread messages in a conversation as read
    // =========================================================================

    public function markRead(Request $request, $conversationId)
    {
        try {
            $conversation = ChatConversation::findOrFail($conversationId);
            if (!$this->authorizeConversation($request, $conversation)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $conversation->markReadFor($request->user());

            return response()->json(['success' => true, 'message' => 'Messages marked as read.']);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Conversation not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error marking messages read: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to mark messages read', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // destroy — Admin deletes a message (moderation)
    // =========================================================================

    public function destroy(Request $request, $id)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $message = ChatMessage::findOrFail($id);

            if ($message->attachment_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($message->attachment_path);
            }
            $message->delete();

            ActivityLog::record($request->user(), 'deleted_chat_message', $message);

            return response()->json(['success' => true, 'message' => 'Message deleted.']);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Message not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting chat message: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete message', 'error' => $e->getMessage()], 500);
        }
    }
}
