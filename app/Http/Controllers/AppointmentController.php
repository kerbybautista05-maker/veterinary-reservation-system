<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Appointment;
use App\Models\Notification;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AppointmentController extends Controller
{
    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private function canManage(Request $request, Appointment $appointment): bool
    {
        $user = $request->user();
        return $user->isAdmin()
            || ($user->isVeterinarian() && $appointment->veterinarian_id === $user->id)
            || ($user->isPetOwner() && $appointment->owner_id === $user->id);
    }

    private function unauthorized(): \Illuminate\Http\JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
    }

    private function hasConflict(int $vetId, string $date, string $time, ?int $excludeId = null): bool
    {
        return Appointment::forVeterinarian($vetId)
            ->forDate($date)
            ->where('appointment_time', $time)
            ->whereIn('status', Appointment::ACTIVE_STATUSES)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->exists();
    }

    private function isSlotBooked(string $date, string $time, ?int $excludeId = null): bool
    {
        return Appointment::forDate($date)
            ->where('appointment_time', $time)
            ->whereIn('status', Appointment::ACTIVE_STATUSES)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->exists();
    }

    private function isWithinBusinessHours(string $time, string $date = null): bool
    {
        if ($date) {
            $dayOfWeek = Carbon::parse($date)->dayOfWeek; // 0 = Sunday
            $closeTime = $dayOfWeek === 0 ? '16:00' : '17:30';
        } else {
            $closeTime = '17:30';
        }
        return $time >= '09:00' && $time <= $closeTime;
    }

    private function isPastAppointment(string $time, string $date): bool
    {
        $appointmentDateTime = Carbon::parse("{$date} {$time}");
        return $appointmentDateTime->lte(Carbon::now());
    }

    // =========================================================================
    // checkSlot — verify if a time slot is available
    // GET /api/appointments/check-slot?date=YYYY-MM-DD&time=HH:mm
    // =========================================================================

    public function checkSlot(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'date' => 'required|date|after_or_equal:today',
                'time' => 'required|date_format:H:i',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $date = $request->input('date');
            $time = $request->input('time');

            if (!$this->isWithinBusinessHours($time, $date)) {
                $dayOfWeek = Carbon::parse($date)->dayOfWeek;
                $closeTime = $dayOfWeek === 0 ? '4:00 PM' : '5:30 PM';
                return response()->json([
                    'success'   => true,
                    'data'      => ['available' => false, 'reason' => 'outside_business_hours'],
                    'message'   => "Appointment time must be between 9:00 AM and {$closeTime}.",
                ]);
            }

            if ($this->isPastAppointment($time, $date)) {
                return response()->json([
                    'success'   => true,
                    'data'      => ['available' => false, 'reason' => 'past_time'],
                    'message'   => 'Hindi puwedeng mag-book ng appointment sa oras na nakalipas na. Pumili ng ibang oras.',
                ]);
            }

            $isBooked = $this->isSlotBooked($date, $time);

            return response()->json([
                'success' => true,
                'data'    => [
                    'available' => !$isBooked,
                    'reason'    => $isBooked ? 'already_booked' : null,
                ],
                'message' => $isBooked ? 'This time slot is already booked.' : 'Time slot is available.',
            ]);

        } catch (\Exception $e) {
            Log::error('Error checking slot availability: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to check slot availability.'], 500);
        }
    }

    // =========================================================================
    // emergencyPending — list pending emergency bookings (Admin only)
    // GET /api/appointments/emergency/pending
    // =========================================================================

    public function emergencyPending(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $emergencies = Appointment::where('type', 'emergency')
                ->where('status', 'pending')
                ->with(['pet', 'owner'])
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
                ->map(fn ($a) => [
                    'id'              => $a->id,
                    'pet_name'        => $a->pet?->name ?? 'Unknown',
                    'owner_name'      => $a->owner?->full_name ?? $a->owner?->name ?? 'Unknown',
                    'reason'          => $a->reason,
                    'appointment_date'=> $a->appointment_date,
                    'appointment_time'=> $a->appointment_time,
                    'created_at'      => $a->created_at,
                    'time_ago'        => $a->created_at->diffForHumans(),
                ]);

            return response()->json([
                'success' => true,
                'data'    => $emergencies,
                'total'   => $emergencies->count(),
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching pending emergencies: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to fetch emergency requests.'], 500);
        }
    }

    // =========================================================================
    // index — list appointments (scoped by role)
    // GET /api/appointments?status=&type=&date_from=&date_to=&pet_id=
    // =========================================================================

    public function index(Request $request)
    {
        try {
            $user  = $request->user();
            $query = Appointment::with(['pet', 'owner', 'veterinarian']);

            if ($user->isPetOwner()) {
                $query->where('owner_id', $user->id);
            } elseif ($user->isVeterinarian()) {
                $query->where('veterinarian_id', $user->id);
            }
            // Admin sees all

            if ($status = $request->input('status')) {
                $query->status($status);
            }
            if ($type = $request->input('type')) {
                $query->where('type', $type);
            }
            if ($petId = $request->input('pet_id')) {
                $query->where('pet_id', $petId);
            }
            if ($from = $request->input('date_from')) {
                $query->where('appointment_date', '>=', $from);
            }
            if ($to = $request->input('date_to')) {
                $query->where('appointment_date', '<=', $to);
            }

            $query->orderBy('appointment_date')->orderBy('appointment_time');

            $perPage      = $request->input('per_page', 15);
            $appointments = $query->paginate($perPage);

            return response()->json([
                'success'    => true,
                'data'       => $appointments->items(),
                'pagination' => [
                    'current_page' => $appointments->currentPage(),
                    'last_page'    => $appointments->lastPage(),
                    'per_page'     => $appointments->perPage(),
                    'total'        => $appointments->total(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching appointments: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve appointments', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // calendar — real-time calendar view for a date range
    // GET /api/appointments/calendar?start=2026-07-01&end=2026-07-31&veterinarian_id=
    // =========================================================================

    public function calendar(Request $request)
    {
        try {
            $user = $request->user();

            $validator = Validator::make($request->all(), [
                'start' => 'required|date',
                'end'   => 'required|date|after_or_equal:start',
            ]);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $query = Appointment::with(['pet', 'owner', 'veterinarian'])
                ->whereBetween('appointment_date', [$request->input('start'), $request->input('end')]);

            if ($user->isPetOwner()) {
                $query->where('owner_id', $user->id);
            } elseif ($user->isVeterinarian()) {
                $query->where('veterinarian_id', $user->id);
            } elseif ($vetId = $request->input('veterinarian_id')) {
                $query->where('veterinarian_id', $vetId);
            }

            $appointments = $query->orderBy('appointment_date')->orderBy('appointment_time')->get();

            $grouped = $appointments->groupBy(fn ($a) => $a->appointment_date->toDateString());

            return response()->json(['success' => true, 'data' => $grouped]);

        } catch (\Exception $e) {
            Log::error('Error fetching calendar: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve calendar', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // store — book an appointment (Pet Owner), including emergency bookings
    // =========================================================================

    public function store(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user->isPetOwner() && !$user->isAdmin()) {
                return $this->unauthorized();
            }

            $validator = Validator::make($request->all(), [
                'pet_id'            => 'required|exists:pets,id',
                'owner_id'          => 'nullable|exists:users,id', // admin booking on behalf of an owner
                'veterinarian_id'   => 'nullable|exists:users,id',
                'appointment_date'  => 'required|date|after_or_equal:today',
                'appointment_time'  => 'required|date_format:H:i',
                'duration_minutes'  => 'nullable|integer|min:10|max:240',
                'type'              => 'nullable|in:regular,emergency',
                'service_type'      => 'nullable|string|max:150',
                'reason'            => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $data = $validator->validated();
            $isEmergency = ($data['type'] ?? null) === 'emergency';

            if (!$isEmergency) {
                if (!$this->isWithinBusinessHours($data['appointment_time'], $data['appointment_date'])) {
                    $dayOfWeek = Carbon::parse($data['appointment_date'])->dayOfWeek;
                    $closeTime = $dayOfWeek === 0 ? '4:00 PM' : '5:30 PM';
                    return response()->json(['success' => false, 'message' => "Appointment time must be between 9:00 AM and {$closeTime}."], 422);
                }

                if ($this->isPastAppointment($data['appointment_time'], $data['appointment_date'])) {
                    return response()->json(['success' => false, 'message' => 'Hindi puwedeng mag-book ng appointment sa oras na nakalipas na. Pumili ng ibang oras.'], 422);
                }
            }

            if ($this->isSlotBooked($data['appointment_date'], $data['appointment_time'])) {
                return response()->json(['success' => false, 'message' => 'This time slot is already booked. Please choose another time.'], 422);
            }

            $ownerId = $user->isAdmin() && !empty($data['owner_id']) ? $data['owner_id'] : $user->id;
            $pet     = Pet::findOrFail($data['pet_id']);

            if (!$user->isAdmin() && $pet->owner_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'You may only book appointments for your own pets.'], 403);
            }

            if (!empty($data['veterinarian_id']) && $this->hasConflict($data['veterinarian_id'], $data['appointment_date'], $data['appointment_time'])) {
                return response()->json(['success' => false, 'message' => 'This veterinarian already has an appointment at that time.'], 422);
            }

            $appointment = Appointment::create([
                'pet_id'            => $pet->id,
                'owner_id'          => $ownerId,
                'veterinarian_id'   => $data['veterinarian_id'] ?? null,
                'appointment_date'  => $data['appointment_date'],
                'appointment_time'  => $data['appointment_time'],
                'duration_minutes'  => $data['duration_minutes'] ?? 30,
                'type'              => $data['type'] ?? Appointment::TYPE_REGULAR,
                'status'            => Appointment::STATUS_PENDING,
                'service_type'      => $data['service_type'] ?? null,
                'reason'            => $data['reason'] ?? null,
            ]);

            ActivityLog::record($user, 'booked_appointment', $appointment, null, $appointment->toArray());

            // Notify: admins always; the pre-assigned vet if one was picked;
            // and — for emergencies specifically — every veterinarian marked
            // available for emergency care, since an emergency booking has no
            // vet assigned yet and shouldn't sit waiting on an admin to route it.
            $recipients = User::where('is_active', true)->admins()->get();

            if ($appointment->veterinarian_id) {
                $recipients = $recipients->merge(User::where('id', $appointment->veterinarian_id)->get());
            }

            if ($appointment->isEmergency()) {
                $emergencyVets = User::veterinarians()->active()
                    ->whereHas('veterinarianProfile', fn ($q) => $q->availableForEmergency())
                    ->get();
                $recipients = $recipients->merge($emergencyVets);
            }

            $recipients = $recipients->unique('id');

            foreach ($recipients as $recipient) {
                // Deep link is role-aware: admin/vet each have their own
                // appointment detail route, there's no generic /appointments/{id}.
                $deepLink = $recipient->isAdmin()
                    ? "/admin/appointments/{$appointment->id}"
                    : "/vet/appointments/{$appointment->id}";

                Notification::notify(
                    $recipient,
                    $appointment->isEmergency() ? 'Emergency Booking' : 'New Appointment Booked',
                    "{$pet->name}'s appointment is requested for {$appointment->appointment_date->toDateString()} at {$appointment->appointment_time}.",
                    Notification::TYPE_APPOINTMENT_UPDATE,
                    Notification::CHANNEL_BOTH,
                    $deepLink
                );
            }

            return response()->json([
                'success' => true,
                'data'    => $appointment->load(['pet', 'owner', 'veterinarian']),
                'message' => 'Appointment booked successfully.',
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error booking appointment: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to book appointment', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // storeWalkIn — log a walk-in appointment (Admin/Staff only)
    // POST /api/appointments/walk-in
    // =========================================================================

    public function storeWalkIn(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user->isAdmin()) {
                return $this->unauthorized();
            }

            $isEmergency = $request->boolean('is_emergency');

            $rules = [
                'owner_name'        => 'required|string|max:255',
                'owner_phone'       => 'required|string|max:50',
                'owner_email'       => 'nullable|email|max:255',
                'pet_name'          => 'required|string|max:255',
                'pet_species'       => 'required|string|max:100',
                'pet_breed'         => 'nullable|string|max:100',
                'service_type'      => 'required|string|max:150',
                'veterinarian_id'   => 'nullable|exists:users,id',
                'reason'            => 'nullable|string',
                'appointment_date'  => 'nullable|date',
                'appointment_time'  => 'nullable|date_format:H:i',
                'is_emergency'      => 'boolean',
                'status'            => 'nullable|in:confirmed,in_progress,completed',
            ];

            if ($isEmergency) {
                $rules['symptoms']     = 'required|array|min:1';
                $rules['severity']     = 'required|in:critical,serious,moderate';
            }

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $data = $validator->validated();

            // ── Find or create owner ──────────────────────────────────────
            $owner = null;
            if (!empty($data['owner_email'])) {
                $owner = User::where('email', $data['owner_email'])->first();
            }
            if (!$owner) {
                $nameParts = array_filter(explode(' ', $data['owner_name']));
                $lastName  = array_pop($nameParts) ?? '';
                $firstName = implode(' ', $nameParts) ?: $lastName;

                $owner = User::create([
                    'first_name'      => $firstName,
                    'last_name'       => $lastName,
                    'email'           => $data['owner_email'] ?? ('walkin_' . time() . '_' . rand(1000,9999) . '@placeholder.local'),
                    'phone_number'    => $data['owner_phone'],
                    'role'            => User::ROLE_PET_OWNER,
                    'approval_status' => 'approved',
                    'is_active'       => true,
                    'password'        => bcrypt('password'),
                    'approved_at'     => now(),
                ]);
            } else {
                if (!empty($data['owner_phone']) && empty($owner->phone_number)) {
                    $owner->update(['phone_number' => $data['owner_phone']]);
                }
            }

            // ── Find or create pet ────────────────────────────────────────
            $pet = Pet::where('owner_id', $owner->id)
                ->whereRaw('LOWER(name) = ?', [strtolower($data['pet_name'])])
                ->first();

            if (!$pet) {
                $pet = Pet::create([
                    'owner_id' => $owner->id,
                    'name'     => $data['pet_name'],
                    'species'  => $data['pet_species'],
                    'breed'    => $data['pet_breed'] ?? null,
                    'sex'      => 'unknown',
                    'is_active'=> true,
                ]);
            }

            // ── Build reason / notes ──────────────────────────────────────
            $reason = $data['reason'] ?? null;
            if ($isEmergency && !empty($data['symptoms'])) {
                $symptomsStr = implode(', ', $data['symptoms']);
                $reason = ($reason ? "{$reason}. " : '') . "Symptoms: {$symptomsStr}. Severity: {$data['severity']}.";
            }

            $apptDate = $data['appointment_date'] ?? now()->toDateString();
            $apptTime = $data['appointment_time'] ?? now()->format('H:i');
            $apptStatus = $data['status'] ?? ($isEmergency ? Appointment::STATUS_IN_PROGRESS : Appointment::STATUS_CONFIRMED);

            $appointment = Appointment::create([
                'pet_id'            => $pet->id,
                'owner_id'          => $owner->id,
                'veterinarian_id'   => $data['veterinarian_id'] ?? null,
                'appointment_date'  => $apptDate,
                'appointment_time'  => $apptTime,
                'duration_minutes'  => 30,
                'type'              => $isEmergency ? Appointment::TYPE_EMERGENCY : Appointment::TYPE_REGULAR,
                'status'            => $apptStatus,
                'service_type'      => $data['service_type'],
                'reason'            => $reason,
                'notes'             => 'Walk-in',
            ]);

            ActivityLog::record($user, 'logged_walk_in', $appointment, null, $appointment->toArray());

            // ── Notify admins ─────────────────────────────────────────────
            $adminRecipients = User::where('is_active', true)->admins()->get();
            foreach ($adminRecipients as $admin) {
                Notification::notify(
                    $admin,
                    $isEmergency ? 'Emergency Walk-in Logged' : 'Walk-in Logged',
                    "{$pet->name} ({$owner->first_name} {$owner->last_name}) — {$data['service_type']}.",
                    Notification::TYPE_APPOINTMENT_UPDATE,
                    Notification::CHANNEL_BOTH,
                    "/admin/appointments/{$appointment->id}"
                );
            }

            if ($appointment->veterinarian_id) {
                $vet = User::find($appointment->veterinarian_id);
                if ($vet) {
                    Notification::notify(
                        $vet,
                        $isEmergency ? 'Emergency Walk-in Assigned' : 'Walk-in Assigned',
                        "You have been assigned a walk-in: {$pet->name} — {$data['service_type']}.",
                        Notification::TYPE_APPOINTMENT_UPDATE,
                        Notification::CHANNEL_BOTH,
                        "/vet/appointments/{$appointment->id}"
                    );
                }
            }

            // ── Notify pet owner (if email provided) ──────────────────────
            if (!empty($data['owner_email']) && $owner->email && $owner->email !== $data['owner_email']) {
                // Owner was created with placeholder email, send to provided email directly
                \App\Support\ClinicMail::send(
                    $owner,
                    $isEmergency ? 'Emergency Walk-in Confirmation' : 'Walk-in Confirmation',
                    $isEmergency ? 'Emergency Walk-in Received' : 'Walk-in Confirmation',
                    "Dear {$owner->first_name},\n\nYour walk-in request for {$pet->name} has been logged.\n\nService: {$data['service_type']}\nDate: {$apptDate}\nTime: {$apptTime}" .
                    ($appointment->veterinarian_id ? "\nAssigned Vet: Dr. " . ($vet->full_name ?? $vet->name ?? '') : '') .
                    ($isEmergency ? "\n\nOur team is currently attending to {$pet->name}. Please wait for assistance." : ''),
                    'View Appointment',
                    url("/admin/appointments/{$appointment->id}")
                );
            } elseif ($owner->email) {
                Notification::notify(
                    $owner,
                    $isEmergency ? 'Emergency Walk-in Confirmation' : 'Walk-in Confirmation',
                    "Your walk-in for {$pet->name} has been logged — Service: {$data['service_type']}, Date: {$apptDate} at {$apptTime}.",
                    Notification::TYPE_APPOINTMENT_UPDATE,
                    Notification::CHANNEL_BOTH,
                    "/owner/appointments/{$appointment->id}"
                );
            }

            return response()->json([
                'success' => true,
                'data'    => $appointment->load(['pet', 'owner', 'veterinarian']),
                'message' => $isEmergency ? 'Emergency walk-in logged successfully.' : 'Walk-in appointment logged successfully.',
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error logging walk-in: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to log walk-in.', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // show
    // =========================================================================

    public function show(Request $request, $id)
    {
        try {
            $appointment = Appointment::with(['pet', 'owner', 'veterinarian', 'statusLogs.changedBy', 'medicalRecord', 'payment', 'feedback'])
                ->findOrFail($id);

            if (!$this->canManage($request, $appointment)) {
                return $this->unauthorized();
            }

            return response()->json(['success' => true, 'data' => $appointment]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Appointment not found'], 404);
        }
    }

    // =========================================================================
    // update — edit date/time/reason while still pending or confirmed
    // =========================================================================

    public function update(Request $request, $id)
    {
        try {
            $appointment = Appointment::findOrFail($id);

            if (!$this->canManage($request, $appointment)) {
                return $this->unauthorized();
            }
            if (!$appointment->canBeCancelled()) {
                return response()->json(['success' => false, 'message' => 'This appointment can no longer be modified.'], 422);
            }

            $validator = Validator::make($request->all(), [
                'appointment_date' => 'sometimes|required|date|after_or_equal:today',
                'appointment_time' => 'sometimes|required|date_format:H:i',
                'veterinarian_id'  => 'nullable|exists:users,id',
                'service_type'     => 'nullable|string|max:150',
                'reason'           => 'nullable|string',
                'notes'            => 'nullable|string',
            ]);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $data = $validator->validated();
            $old  = $appointment->toArray();

            $checkVet  = $data['veterinarian_id'] ?? $appointment->veterinarian_id;
            $checkDate = $data['appointment_date'] ?? $appointment->appointment_date->toDateString();
            $checkTime = $data['appointment_time'] ?? $appointment->appointment_time;

            if (!$this->isWithinBusinessHours($checkTime, $checkDate)) {
                $dayOfWeek = Carbon::parse($checkDate)->dayOfWeek;
                $closeTime = $dayOfWeek === 0 ? '4:00 PM' : '5:30 PM';
                return response()->json(['success' => false, 'message' => "Appointment time must be between 9:00 AM and {$closeTime}."], 422);
            }

            if ($this->isPastAppointment($checkTime, $checkDate)) {
                return response()->json(['success' => false, 'message' => 'Hindi puwedeng mag-book ng appointment sa oras na nakalipas na. Pumili ng ibang oras.'], 422);
            }

            if ($this->isSlotBooked($checkDate, $checkTime, $appointment->id)) {
                return response()->json(['success' => false, 'message' => 'This time slot is already booked. Please choose another time.'], 422);
            }

            if ($checkVet && $this->hasConflict($checkVet, $checkDate, $checkTime, $appointment->id)) {
                return response()->json(['success' => false, 'message' => 'This veterinarian already has an appointment at that time.'], 422);
            }

            $appointment->update($data);

            ActivityLog::record($request->user(), 'updated_appointment', $appointment, $old, $appointment->fresh()->toArray());

            Notification::notify(
                $appointment->owner,
                'Appointment Updated',
                "Your appointment for {$appointment->pet->name} has been updated.",
                Notification::TYPE_APPOINTMENT_UPDATE
            );

            return response()->json([
                'success' => true,
                'data'    => $appointment->fresh(['pet', 'owner', 'veterinarian']),
                'message' => 'Appointment updated successfully.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Appointment not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error updating appointment: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update appointment', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // reschedule — creates a new linked appointment and marks this one rescheduled
    // =========================================================================

    public function reschedule(Request $request, $id)
    {
        try {
            $appointment = Appointment::findOrFail($id);

            if (!$this->canManage($request, $appointment)) {
                return $this->unauthorized();
            }
            if (!$appointment->canBeCancelled()) {
                return response()->json(['success' => false, 'message' => 'This appointment can no longer be rescheduled.'], 422);
            }

            $validator = Validator::make($request->all(), [
                'appointment_date' => 'required|date|after_or_equal:today',
                'appointment_time' => 'required|date_format:H:i',
            ]);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $newDate = $request->input('appointment_date');
            $newTime = $request->input('appointment_time');

            if (!$this->isWithinBusinessHours($newTime, $newDate)) {
                $dayOfWeek = Carbon::parse($newDate)->dayOfWeek;
                $closeTime = $dayOfWeek === 0 ? '4:00 PM' : '5:30 PM';
                return response()->json(['success' => false, 'message' => "Appointment time must be between 9:00 AM and {$closeTime}."], 422);
            }

            if ($this->isPastAppointment($newTime, $newDate)) {
                return response()->json(['success' => false, 'message' => 'Hindi puwedeng mag-book ng appointment sa oras na nakalipas na. Pumili ng ibang oras.'], 422);
            }

            if ($this->isSlotBooked($newDate, $newTime)) {
                return response()->json(['success' => false, 'message' => 'This time slot is already booked. Please choose another time.'], 422);
            }

            if ($appointment->veterinarian_id && $this->hasConflict($appointment->veterinarian_id, $newDate, $newTime)) {
                return response()->json(['success' => false, 'message' => 'This veterinarian already has an appointment at that time.'], 422);
            }

            $new = $appointment->rescheduleTo(
                $newDate,
                $newTime,
                $request->user()
            );

            ActivityLog::record($request->user(), 'rescheduled_appointment', $appointment, null, ['new_appointment_id' => $new->id]);

            Notification::notify(
                $appointment->owner,
                'Appointment Rescheduled',
                "{$appointment->pet->name}'s appointment has been rescheduled to {$new->appointment_date->toDateString()} at {$new->appointment_time}.",
                Notification::TYPE_APPOINTMENT_UPDATE
            );

            return response()->json([
                'success' => true,
                'data'    => $new->load(['pet', 'owner', 'veterinarian']),
                'message' => 'Appointment rescheduled successfully.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Appointment not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error rescheduling appointment: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to reschedule appointment', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // cancel
    // =========================================================================

    public function cancel(Request $request, $id)
    {
        try {
            $appointment = Appointment::findOrFail($id);

            if (!$this->canManage($request, $appointment)) {
                return $this->unauthorized();
            }
            if (!$appointment->canBeCancelled()) {
                return response()->json(['success' => false, 'message' => 'This appointment can no longer be cancelled.'], 422);
            }

            $validator = Validator::make($request->all(), [
                'reason' => 'nullable|string|max:255',
            ]);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $appointment->cancel($request->user(), $request->input('reason'));

            ActivityLog::record($request->user(), 'cancelled_appointment', $appointment);

            $notifyTarget = $request->user()->id === $appointment->owner_id ? $appointment->veterinarian : $appointment->owner;
            if ($notifyTarget) {
                Notification::notify(
                    $notifyTarget,
                    'Appointment Cancelled',
                    "{$appointment->pet->name}'s appointment on {$appointment->appointment_date->toDateString()} has been cancelled.",
                    Notification::TYPE_APPOINTMENT_CANCELLATION
                );
            }

            return response()->json([
                'success' => true,
                'data'    => $appointment->fresh(),
                'message' => 'Appointment cancelled.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Appointment not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error cancelling appointment: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to cancel appointment', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // confirm — Veterinarian or Admin confirms a pending appointment
    // =========================================================================

    public function confirm(Request $request, $id)
    {
        try {
            $user = $request->user();
            if (!$user->isVeterinarian() && !$user->isAdmin()) {
                return $this->unauthorized();
            }

            $appointment = Appointment::findOrFail($id);
            if (!$appointment->isPending()) {
                return response()->json(['success' => false, 'message' => 'Only pending appointments can be confirmed.'], 422);
            }

            $appointment->confirm($user->isVeterinarian() ? $user : null);

            ActivityLog::record($user, 'confirmed_appointment', $appointment);

            Notification::notify(
                $appointment->owner,
                'Appointment Confirmed',
                "{$appointment->pet->name}'s appointment on {$appointment->appointment_date->toDateString()} has been confirmed.",
                Notification::TYPE_APPOINTMENT_UPDATE
            );

            return response()->json([
                'success' => true,
                'data'    => $appointment->fresh(['pet', 'owner', 'veterinarian']),
                'message' => 'Appointment confirmed.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Appointment not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error confirming appointment: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to confirm appointment', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // complete — Veterinarian marks the visit as completed
    // =========================================================================

    public function complete(Request $request, $id)
    {
        try {
            $user = $request->user();
            $appointment = Appointment::findOrFail($id);

            if (!$user->isAdmin() && !($user->isVeterinarian() && $appointment->veterinarian_id === $user->id)) {
                return $this->unauthorized();
            }

            $appointment->complete();
            ActivityLog::record($user, 'completed_appointment', $appointment);

            Notification::notify(
                $appointment->owner,
                'Appointment Completed',
                "{$appointment->pet->name}'s appointment has been marked completed. Feel free to leave feedback!",
                Notification::TYPE_APPOINTMENT_UPDATE
            );

            return response()->json([
                'success' => true,
                'data'    => $appointment->fresh(['pet', 'owner', 'veterinarian']),
                'message' => 'Appointment marked completed.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Appointment not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error completing appointment: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to complete appointment', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // noShow — Veterinarian or Admin marks the pet owner as a no-show
    // =========================================================================

    public function noShow(Request $request, $id)
    {
        try {
            $user = $request->user();
            if (!$user->isVeterinarian() && !$user->isAdmin()) {
                return $this->unauthorized();
            }

            $appointment = Appointment::findOrFail($id);
            $appointment->markNoShow();

            ActivityLog::record($user, 'marked_appointment_no_show', $appointment);

            return response()->json([
                'success' => true,
                'data'    => $appointment->fresh(),
                'message' => 'Appointment marked as no-show.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Appointment not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error marking no-show: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update appointment', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // destroy — Admin hard-deletes an appointment record (rare/cleanup only)
    // =========================================================================

    public function destroy(Request $request, $id)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return $this->unauthorized();
            }

            $appointment = Appointment::findOrFail($id);
            $appointment->delete();

            ActivityLog::record($request->user(), 'deleted_appointment', $appointment);

            return response()->json(['success' => true, 'message' => 'Appointment deleted.']);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Appointment not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting appointment: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete appointment', 'error' => $e->getMessage()], 500);
        }
    }
}