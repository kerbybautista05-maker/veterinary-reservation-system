<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Appointment;
use App\Models\Feedback;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class FeedbackController extends Controller
{
    // =========================================================================
    // index — Admin sees all (incl. unpublished); Vet sees published feedback
    // about themselves; Pet Owner sees their own submissions
    // =========================================================================

    public function index(Request $request)
    {
        try {
            $user  = $request->user();
            $query = Feedback::with(['owner', 'appointment', 'veterinarian']);

            if ($user->isPetOwner()) {
                $query->where('owner_id', $user->id);
            } elseif ($user->isVeterinarian()) {
                $query->forVeterinarian($user->id)->published();
            } elseif (!$request->boolean('include_unpublished')) {
                $query->published();
            }

            if ($vetId = $request->input('veterinarian_id')) {
                $query->forVeterinarian($vetId);
            }
            if ($minRating = $request->input('min_rating')) {
                $query->minRating((int) $minRating);
            }

            $feedbacks = $query->orderByDesc('created_at')->paginate($request->input('per_page', 15));

            return response()->json([
                'success'    => true,
                'data'       => $feedbacks->items(),
                'pagination' => [
                    'current_page' => $feedbacks->currentPage(),
                    'last_page'    => $feedbacks->lastPage(),
                    'per_page'     => $feedbacks->perPage(),
                    'total'        => $feedbacks->total(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching feedback: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve feedback', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // store — Pet Owner submits feedback for a completed appointment
    // =========================================================================

    public function store(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user->isPetOwner()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized: Pet Owner access required.'], 403);
            }

            $validator = Validator::make($request->all(), [
                'appointment_id' => 'nullable|exists:appointments,id',
                'veterinarian_id' => 'nullable|exists:users,id',
                'rating'  => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|max:2000',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $data = $validator->validated();

            if (!empty($data['appointment_id'])) {
                $appointment = Appointment::findOrFail($data['appointment_id']);
                if ($appointment->owner_id !== $user->id) {
                    return response()->json(['success' => false, 'message' => 'You may only leave feedback for your own appointments.'], 403);
                }
                $data['veterinarian_id'] = $data['veterinarian_id'] ?? $appointment->veterinarian_id;
            }

            $data['owner_id'] = $user->id;

            $feedback = Feedback::create($data);

            ActivityLog::record($user, 'submitted_feedback', $feedback, null, $feedback->toArray());

            return response()->json([
                'success' => true,
                'data'    => $feedback->load(['owner', 'appointment', 'veterinarian']),
                'message' => 'Thank you for your feedback!',
            ], 201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Appointment not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error submitting feedback: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to submit feedback', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // show
    // =========================================================================

    public function show(Request $request, $id)
    {
        try {
            $feedback = Feedback::with(['owner', 'appointment', 'veterinarian', 'respondedBy'])->findOrFail($id);
            $user     = $request->user();

            if (!$feedback->is_published && !$user->isAdmin() && $feedback->owner_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'Feedback not found'], 404);
            }

            return response()->json(['success' => true, 'data' => $feedback]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Feedback not found'], 404);
        }
    }

    // =========================================================================
    // respond — Admin replies to feedback
    // =========================================================================

    public function respond(Request $request, $id)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $validator = Validator::make($request->all(), [
                'response' => 'required|string|max:2000',
            ]);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $feedback = Feedback::findOrFail($id);
            $feedback->respond($request->user(), $request->input('response'));

            ActivityLog::record($request->user(), 'responded_to_feedback', $feedback);

            Notification::notify(
                $feedback->owner,
                'Response to Your Feedback',
                'The clinic has responded to your feedback.',
                Notification::TYPE_FEEDBACK_RESPONSE,
                Notification::CHANNEL_APP,
                "/feedback/{$feedback->id}"
            );

            return response()->json([
                'success' => true,
                'data'    => $feedback->fresh(['owner', 'respondedBy']),
                'message' => 'Response submitted.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Feedback not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error responding to feedback: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to respond to feedback', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // togglePublish — Admin publishes/hides feedback
    // =========================================================================

    public function togglePublish(Request $request, $id)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $feedback = Feedback::findOrFail($id);
            $feedback->is_published ? $feedback->hide() : $feedback->publish();

            ActivityLog::record($request->user(), $feedback->is_published ? 'published_feedback' : 'hid_feedback', $feedback);

            return response()->json([
                'success' => true,
                'data'    => $feedback->fresh(),
                'message' => $feedback->is_published ? 'Feedback published.' : 'Feedback hidden.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Feedback not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error toggling feedback visibility: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update feedback', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // destroy — Admin removes feedback
    // =========================================================================

    public function destroy(Request $request, $id)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $feedback = Feedback::findOrFail($id);
            $feedback->delete();

            ActivityLog::record($request->user(), 'deleted_feedback', $feedback);

            return response()->json(['success' => true, 'message' => 'Feedback deleted.']);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Feedback not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting feedback: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete feedback', 'error' => $e->getMessage()], 500);
        }
    }
}
