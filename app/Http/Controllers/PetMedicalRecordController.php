<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Pet;
use App\Models\PetMedicalRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PetMedicalRecordController extends Controller
{
    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private function canView(Request $request, Pet $pet): bool
    {
        $user = $request->user();
        return $user->isAdmin() || $user->isVeterinarian() || ($user->isPetOwner() && $pet->owner_id === $user->id);
    }

    private function vetOrAdminOnly(Request $request): ?\Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        if (!$user->isVeterinarian() && !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized: Veterinarian access required.'], 403);
        }
        return null;
    }

    // =========================================================================
    // index — list medical records for a pet
    // GET /api/pets/{petId}/medical-records
    // =========================================================================

    public function index(Request $request, $petId)
    {
        try {
            $pet = Pet::findOrFail($petId);
            if (!$this->canView($request, $pet)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $records = $pet->medicalRecords()
                ->with(['veterinarian', 'appointment'])
                ->orderByDesc('visit_date')
                ->paginate($request->input('per_page', 10));

            return response()->json([
                'success'    => true,
                'data'       => $records->items(),
                'pagination' => [
                    'current_page' => $records->currentPage(),
                    'last_page'    => $records->lastPage(),
                    'per_page'     => $records->perPage(),
                    'total'        => $records->total(),
                ],
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Pet not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching medical records: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve medical records', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // searchPatients — Veterinarian searches patient information across pets
    // GET /api/medical-records/search-patients?q=
    // =========================================================================

    public function searchPatients(Request $request)
    {
        try {
            $guard = $this->vetOrAdminOnly($request);
            if ($guard) return $guard;

            $search = $request->input('q', '');
            if (strlen($search) < 2) {
                return response()->json(['success' => false, 'message' => 'Search term must be at least 2 characters.'], 422);
            }

            $pets = Pet::with('owner')
                ->search($search)
                ->orWhereHas('owner', fn ($q) => $q->where('first_name', 'like', "%{$search}%")
                                                     ->orWhere('last_name', 'like', "%{$search}%"))
                ->limit(25)
                ->get();

            return response()->json(['success' => true, 'data' => $pets]);

        } catch (\Exception $e) {
            Log::error('Error searching patients: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to search patients', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // store — Veterinarian creates a medical record for a pet
    // =========================================================================

    public function store(Request $request, $petId)
    {
        try {
            $pet = Pet::findOrFail($petId);
            $user = $request->user();

            if (!$user->isAdmin() && !$user->isVeterinarian() && !($user->isPetOwner() && $pet->owner_id === $user->id)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $validator = Validator::make($request->all(), [
                'appointment_id'  => 'nullable|exists:appointments,id',
                'service_type'    => 'nullable|string|max:150',
                'visit_date'      => 'required|date',
                'weight_kg'       => 'nullable|numeric|min:0',
                'temperature_c'   => 'nullable|numeric|min:0',
                'symptoms'        => 'nullable|string',
                'diagnosis'       => 'nullable|string',
                'treatment'       => 'nullable|string',
                'prescription'    => 'nullable|string',
                'lab_results'     => 'nullable|string',
                'notes'           => 'nullable|string',
                'follow_up_date'  => 'nullable|date|after_or_equal:visit_date',
                'attachments'     => 'nullable|array',
                'attachments.*'   => 'file|max:10240',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $data = $validator->validated();

            if ($request->hasFile('attachments')) {
                $data['attachments'] = collect($request->file('attachments'))
                    ->map(fn ($file) => $file->store('medical-records', 'public'))
                    ->all();
            } else {
                unset($data['attachments']);
            }

            $data['pet_id']           = $pet->id;
            $data['veterinarian_id']  = $user->isVeterinarian() || $user->isAdmin() ? $user->id : null;

            $record = PetMedicalRecord::create($data);

            ActivityLog::record($request->user(), 'created_medical_record', $record, null, $record->toArray());

            return response()->json([
                'success' => true,
                'data'    => $record->load(['pet', 'veterinarian']),
                'message' => 'Medical record created successfully.',
            ], 201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Pet not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error creating medical record: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to create medical record', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // show
    // =========================================================================

    public function show(Request $request, $id)
    {
        try {
            $record = PetMedicalRecord::with(['pet', 'veterinarian', 'appointment'])->findOrFail($id);

            if (!$this->canView($request, $record->pet)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            return response()->json(['success' => true, 'data' => $record]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Medical record not found'], 404);
        }
    }

    // =========================================================================
    // update — Veterinarian who wrote the record (or Admin) edits it
    // =========================================================================

    public function update(Request $request, $id)
    {
        try {
            $record = PetMedicalRecord::findOrFail($id);
            $user   = $request->user();

            if (!$user->isAdmin() && $record->veterinarian_id !== $user->id && !($user->isPetOwner() && $record->pet->owner_id === $user->id)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $validator = Validator::make($request->all(), [
                'service_type'    => 'nullable|string|max:150',
                'visit_date'      => 'sometimes|required|date',
                'weight_kg'       => 'nullable|numeric|min:0',
                'temperature_c'   => 'nullable|numeric|min:0',
                'symptoms'        => 'nullable|string',
                'diagnosis'       => 'nullable|string',
                'treatment'       => 'nullable|string',
                'prescription'    => 'nullable|string',
                'lab_results'     => 'nullable|string',
                'notes'           => 'nullable|string',
                'follow_up_date'  => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $old = $record->toArray();
            $record->update($validator->validated());

            ActivityLog::record($user, 'updated_medical_record', $record, $old, $record->fresh()->toArray());

            return response()->json([
                'success' => true,
                'data'    => $record->fresh(['pet', 'veterinarian']),
                'message' => 'Medical record updated successfully.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Medical record not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error updating medical record: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update medical record', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // destroy — Admin (or authoring Veterinarian) soft-deletes a record
    // =========================================================================

    public function destroy(Request $request, $id)
    {
        try {
            $record = PetMedicalRecord::findOrFail($id);
            $user   = $request->user();

            if (!$user->isAdmin() && $record->veterinarian_id !== $user->id && !($user->isPetOwner() && $record->pet->owner_id === $user->id)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $record->delete();
            ActivityLog::record($user, 'deleted_medical_record', $record);

            return response()->json(['success' => true, 'message' => 'Medical record deleted.']);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Medical record not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting medical record: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete medical record', 'error' => $e->getMessage()], 500);
        }
    }
}