<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\HealthReminder;
use App\Models\Notification;
use App\Models\Pet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class HealthReminderController extends Controller
{
    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private function canAccess(Request $request, HealthReminder $reminder): bool
    {
        $user = $request->user();
        return $user->isAdmin() || $user->isVeterinarian() || $reminder->owner_id === $user->id;
    }

    // =========================================================================
    // index — list reminders (Pet Owner sees own; Admin/Vet can filter by pet)
    // GET /api/health-reminders?pet_id=&status=pending|completed|overdue
    // =========================================================================

    public function index(Request $request)
    {
        try {
            $user  = $request->user();
            $query = HealthReminder::with(['pet', 'owner']);

            if ($user->isPetOwner()) {
                $query->where('owner_id', $user->id);
            }

            if ($petId = $request->input('pet_id')) {
                $query->where('pet_id', $petId);
            }

            switch ($request->input('status')) {
                case 'completed': $query->completed(); break;
                case 'overdue':   $query->overdue(); break;
                case 'due_soon':  $query->dueSoon((int) $request->input('days', 7)); break;
                default:          $query->pending(); break;
            }

            $reminders = $query->orderBy('due_date')->paginate($request->input('per_page', 15));

            return response()->json([
                'success'    => true,
                'data'       => $reminders->items(),
                'pagination' => [
                    'current_page' => $reminders->currentPage(),
                    'last_page'    => $reminders->lastPage(),
                    'per_page'     => $reminders->perPage(),
                    'total'        => $reminders->total(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching health reminders: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve health reminders', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // store — create a reminder (Pet Owner for own pet, or Vet/Admin for any pet)
    // =========================================================================

    public function store(Request $request)
    {
        try {
            $user = $request->user();

            $validator = Validator::make($request->all(), [
                'pet_id'                    => 'required|exists:pets,id',
                'type'                      => 'required|in:vaccination,deworming,checkup,medication,grooming,other',
                'title'                     => 'required|string|max:255',
                'description'               => 'nullable|string',
                'due_date'                  => 'required|date',
                'is_recurring'              => 'sometimes|boolean',
                'recurrence_interval_days'  => 'nullable|integer|min:1|required_if:is_recurring,true',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $pet = Pet::findOrFail($request->input('pet_id'));

            if ($user->isPetOwner() && $pet->owner_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'You may only add reminders for your own pets.'], 403);
            }

            $data               = $validator->validated();
            $data['owner_id']   = $pet->owner_id;
            $data['created_by'] = $user->id;

            $reminder = HealthReminder::create($data);

            ActivityLog::record($user, 'created_health_reminder', $reminder, null, $reminder->toArray());

            return response()->json([
                'success' => true,
                'data'    => $reminder->load(['pet', 'owner']),
                'message' => 'Health reminder created successfully.',
            ], 201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Pet not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error creating health reminder: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to create health reminder', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // show
    // =========================================================================

    public function show(Request $request, $id)
    {
        try {
            $reminder = HealthReminder::with(['pet', 'owner', 'createdBy'])->findOrFail($id);

            if (!$this->canAccess($request, $reminder)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            return response()->json(['success' => true, 'data' => $reminder]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Health reminder not found'], 404);
        }
    }

    // =========================================================================
    // update
    // =========================================================================

    public function update(Request $request, $id)
    {
        try {
            $reminder = HealthReminder::findOrFail($id);
            if (!$this->canAccess($request, $reminder)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $validator = Validator::make($request->all(), [
                'type'                      => 'sometimes|required|in:vaccination,deworming,checkup,medication,grooming,other',
                'title'                     => 'sometimes|required|string|max:255',
                'description'               => 'nullable|string',
                'due_date'                  => 'sometimes|required|date',
                'is_recurring'              => 'sometimes|boolean',
                'recurrence_interval_days'  => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $old = $reminder->toArray();
            $reminder->update($validator->validated());

            ActivityLog::record($request->user(), 'updated_health_reminder', $reminder, $old, $reminder->fresh()->toArray());

            return response()->json([
                'success' => true,
                'data'    => $reminder->fresh(['pet', 'owner']),
                'message' => 'Health reminder updated successfully.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Health reminder not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error updating health reminder: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update health reminder', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // complete — mark a reminder done (auto-creates the next occurrence if recurring)
    // =========================================================================

    public function complete(Request $request, $id)
    {
        try {
            $reminder = HealthReminder::findOrFail($id);
            if (!$this->canAccess($request, $reminder)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $reminder->markCompleted();
            ActivityLog::record($request->user(), 'completed_health_reminder', $reminder);

            return response()->json([
                'success' => true,
                'data'    => $reminder->fresh(),
                'message' => 'Health reminder marked completed.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Health reminder not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error completing health reminder: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to complete health reminder', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // destroy
    // =========================================================================

    public function destroy(Request $request, $id)
    {
        try {
            $reminder = HealthReminder::findOrFail($id);
            if (!$this->canAccess($request, $reminder)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $reminder->delete();
            ActivityLog::record($request->user(), 'deleted_health_reminder', $reminder);

            return response()->json(['success' => true, 'message' => 'Health reminder deleted.']);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Health reminder not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting health reminder: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete health reminder', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // sendDueReminders — cron/scheduler entry point to email pending reminders
    // POST /api/health-reminders/send-due  (protect via scheduler token / admin)
    // =========================================================================

    public function sendDueReminders(Request $request)
    {
        try {
            if (!$request->user()?->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $due = HealthReminder::needingReminderEmail()->with(['pet', 'owner'])->get();

            foreach ($due as $reminder) {
                Notification::notify(
                    $reminder->owner,
                    'Upcoming Health Reminder',
                    "{$reminder->pet->name} has a {$reminder->type} reminder due on {$reminder->due_date->toDateString()}: {$reminder->title}",
                    Notification::TYPE_HEALTH_REMINDER,
                    Notification::CHANNEL_BOTH,
                    "/pets/{$reminder->pet_id}/reminders/{$reminder->id}"
                );
                $reminder->markReminderSent();
            }

            return response()->json(['success' => true, 'message' => "{$due->count()} reminder(s) sent."]);

        } catch (\Exception $e) {
            Log::error('Error sending due reminders: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to send reminders', 'error' => $e->getMessage()], 500);
        }
    }
}
