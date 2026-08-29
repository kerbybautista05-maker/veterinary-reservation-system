<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Appointment;
use App\Models\User;
use App\Models\VeterinarianProfile;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class VeterinarianProfileController extends Controller
{
    // =========================================================================
    // index — browse veterinarians (Pet Owners picking a vet, Admin managing)
    // GET /api/veterinarians?specialization=&emergency_only=&search=
    // =========================================================================

    public function index(Request $request)
    {
        try {
            $query = User::veterinarians()->active()->with('veterinarianProfile');

            if ($specialization = $request->input('specialization')) {
                $query->whereHas('veterinarianProfile', fn ($q) => $q->specializingIn($specialization));
            }

            if ($request->boolean('emergency_only')) {
                $query->whereHas('veterinarianProfile', fn ($q) => $q->availableForEmergency());
            }

            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%");
                });
            }

            $vets = $query->orderBy('last_name')->get();
            $vets->each(fn (User $v) => $v->append(['name', 'full_name', 'profile_photo_url']));

            return response()->json(['success' => true, 'data' => $vets]);

        } catch (\Exception $e) {
            Log::error('Error fetching veterinarians: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve veterinarians', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // show — view a single veterinarian's public profile
    // =========================================================================

    public function show(Request $request, $userId)
    {
        try {
            $vet = User::veterinarians()->with('veterinarianProfile')->findOrFail($userId);
            $vet->append(['name', 'full_name', 'profile_photo_url']);

            return response()->json(['success' => true, 'data' => $vet]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Veterinarian not found'], 404);
        }
    }

    // =========================================================================
    // update — Veterinarian updates their own profile, or Admin updates any
    // =========================================================================

    public function update(Request $request, $userId)
    {
        try {
            $authUser = $request->user();
            $vet      = User::veterinarians()->findOrFail($userId);

            if ($authUser->id !== $vet->id && !$authUser->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $validator = Validator::make($request->all(), [
                'license_number'      => 'nullable|string|max:100',
                'specialization'      => 'nullable|string|max:150',
                'bio'                 => 'nullable|string',
                'years_of_experience' => 'nullable|integer|min:0',
                'working_days'        => 'nullable|array',
                'working_days.*'      => 'string|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
                'shift_start'         => 'nullable|date_format:H:i',
                'shift_end'           => 'nullable|date_format:H:i',
                'is_available_for_emergency' => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $data    = $validator->validated();
            $profile = $vet->veterinarianProfile;
            $old     = $profile?->toArray();

            $profile = VeterinarianProfile::updateOrCreate(['user_id' => $vet->id], $data);

            ActivityLog::record($authUser, 'updated_veterinarian_profile', $profile, $old, $profile->toArray());

            return response()->json([
                'success' => true,
                'data'    => $profile->fresh(),
                'message' => 'Veterinarian profile updated successfully.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Veterinarian not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error updating veterinarian profile: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update profile', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // availability — available time slots for a vet on a given date
    // GET /api/veterinarians/{userId}/availability?date=2026-07-15
    // =========================================================================

    public function availability(Request $request, $userId)
    {
        try {
            $vet = User::veterinarians()->with('veterinarianProfile')->findOrFail($userId);
            $profile = $vet->veterinarianProfile;

            $validator = Validator::make($request->all(), [
                'date' => 'required|date|after_or_equal:today',
            ]);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $date = Carbon::parse($request->input('date'));

            if (!$profile || !$profile->isWorkingOn($date->format('l'))) {
                return response()->json(['success' => true, 'data' => ['is_working' => false, 'slots' => []]]);
            }

            $slotMinutes = 30;
            $start = $profile->shift_start ? Carbon::parse($profile->shift_start->format('H:i')) : Carbon::parse('09:00');
            $end   = $profile->shift_end ? Carbon::parse($profile->shift_end->format('H:i')) : Carbon::parse('17:00');

            $booked = Appointment::forVeterinarian($vet->id)
                ->forDate($date->toDateString())
                ->whereIn('status', Appointment::ACTIVE_STATUSES)
                ->pluck('appointment_time')
                ->map(fn ($t) => substr($t, 0, 5))
                ->all();

            $slots = [];
            for ($t = $start->copy(); $t->lt($end); $t->addMinutes($slotMinutes)) {
                $slots[] = ['time' => $t->format('H:i'), 'available' => !in_array($t->format('H:i'), $booked, true)];
            }

            return response()->json(['success' => true, 'data' => ['is_working' => true, 'slots' => $slots]]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Veterinarian not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching availability: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve availability', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // dashboard — Veterinarian's own monitoring dashboard stats
    // =========================================================================

    public function dashboard(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user->isVeterinarian()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            return response()->json(['success' => true, 'data' => $user->getVeterinarianDashboardStats()]);

        } catch (\Exception $e) {
            Log::error('Error fetching veterinarian dashboard: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve dashboard', 'error' => $e->getMessage()], 500);
        }
    }
}
