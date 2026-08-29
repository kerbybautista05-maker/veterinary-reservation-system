<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Pet;
use App\Models\PetMedicalRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PetController extends Controller
{
    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private function canAccess(Request $request, Pet $pet): bool
    {
        $user = $request->user();
        return $user->isAdmin() || $user->isVeterinarian() || $pet->owner_id === $user->id;
    }

    private function canManage(Request $request, Pet $pet): bool
    {
        $user = $request->user();
        return $user->isAdmin() || $pet->owner_id === $user->id;
    }

    // =========================================================================
    // index — Pet Owner sees own pets; Admin/Vet can filter by owner_id
    // GET /api/pets?owner_id=&species=&is_active=&search=
    // =========================================================================

    public function index(Request $request)
    {
        try {
            $user  = $request->user();
            $query = Pet::with('owner');

            if ($user->isPetOwner()) {
                $query->where('owner_id', $user->id);
            } elseif ($ownerId = $request->input('owner_id')) {
                $query->where('owner_id', $ownerId);
            }

            if ($species = $request->input('species')) {
                $query->species($species);
            }
            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            } else {
                $query->active();
            }
            if ($search = $request->input('search')) {
                $query->search($search);
            }

            $query->orderBy('name');

            $perPage = $request->input('per_page', 15);
            $pets    = $query->paginate($perPage);

            $pets->getCollection()->each(fn (Pet $p) => $p->append(['photo_url', 'age', 'age_label']));

            return response()->json([
                'success'    => true,
                'data'       => $pets->items(),
                'pagination' => [
                    'current_page' => $pets->currentPage(),
                    'last_page'    => $pets->lastPage(),
                    'per_page'     => $pets->perPage(),
                    'total'        => $pets->total(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching pets: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve pets', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // store — Pet Owner registers a pet (Admin may create on behalf of an owner)
    // =========================================================================

    public function store(Request $request)
    {
        try {
            $user = $request->user();

            $validator = Validator::make($request->all(), [
                'owner_id'               => 'nullable|exists:users,id',
                'name'                   => 'required|string|max:150',
                'species'                => 'required|string|max:100',
                'breed'                  => 'required|string|max:150',
                'sex'                    => 'required|in:male,female,unknown',
                'birth_date'             => 'nullable|date|before_or_equal:today',
                'weight_kg'              => 'nullable|numeric|min:0',
                'color'                  => 'nullable|string|max:100',
                'photo'                  => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
                'allergies'              => 'nullable|string',
                'notes'                  => 'nullable|string',
                'medical_records'        => 'nullable|array',
                'medical_records.*.visit_date'    => 'required_with:medical_records|date',
                'medical_records.*.service'       => 'required_with:medical_records|string|max:255',
                'medical_records.*.follow_up_date'=> 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $data = $validator->validated();

            $data['owner_id'] = $user->isAdmin() && !empty($data['owner_id']) ? $data['owner_id'] : $user->id;

            if (!$user->isAdmin() && $data['owner_id'] !== $user->id) {
                return response()->json(['success' => false, 'message' => 'You may only register pets under your own account.'], 403);
            }

            if ($request->hasFile('photo')) {
                $data['photo_path'] = $request->file('photo')->store('pets', 'public');
            }
            unset($data['photo']);

            $pet = Pet::create($data);

            // ── Save medical records ──────────────────────────────────────
            if (!empty($data['medical_records']) && is_array($data['medical_records'])) {
                foreach ($data['medical_records'] as $record) {
                    if (empty($record['visit_date']) || empty($record['service'])) continue;
                    PetMedicalRecord::create([
                        'pet_id'      => $pet->id,
                        'visit_date'  => $record['visit_date'],
                        'treatment'   => $record['service'],
                        'follow_up_date' => $record['follow_up_date'] ?? null,
                    ]);
                }
            }

            ActivityLog::record($user, 'registered_pet', $pet, null, $pet->toArray());

            return response()->json([
                'success' => true,
                'data'    => $pet->load('owner')->append(['photo_url', 'age', 'age_label']),
                'message' => 'Pet registered successfully.',
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating pet: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to register pet', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // show
    // =========================================================================

    public function show(Request $request, $id)
    {
        try {
            $pet = Pet::with('owner')->findOrFail($id);

            if (!$this->canAccess($request, $pet)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $pet->append(['photo_url', 'age', 'age_label']);

            return response()->json(['success' => true, 'data' => $pet]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Pet not found'], 404);
        }
    }

    // =========================================================================
    // update — pet's owner or Admin
    // =========================================================================

    public function update(Request $request, $id)
    {
        try {
            $pet = Pet::findOrFail($id);

            if (!$this->canManage($request, $pet)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $validator = Validator::make($request->all(), [
                'name'                   => 'sometimes|required|string|max:150',
                'species'                => 'sometimes|required|string|max:100',
                'breed'                  => 'sometimes|required|string|max:150',
                'sex'                    => 'sometimes|required|in:male,female,unknown',
                'birth_date'             => 'nullable|date|before_or_equal:today',
                'weight_kg'              => 'nullable|numeric|min:0',
                'color'                  => 'nullable|string|max:100',
                'photo'                  => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
                'remove_photo'           => 'sometimes|boolean',
                'microchip_id'           => 'nullable|string|max:100',
                'is_neutered_or_spayed'  => 'sometimes|boolean',
                'allergies'              => 'nullable|string',
                'notes'                  => 'nullable|string',
                'is_active'              => 'sometimes|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $old  = $pet->toArray();
            $data = $validator->validated();

            if ($request->hasFile('photo')) {
                if ($pet->photo_path) {
                    Storage::disk('public')->delete($pet->photo_path);
                }
                $data['photo_path'] = $request->file('photo')->store('pets', 'public');
            } elseif ($request->boolean('remove_photo') && $pet->photo_path) {
                Storage::disk('public')->delete($pet->photo_path);
                $data['photo_path'] = null;
            }
            unset($data['photo'], $data['remove_photo']);

            // Only Admin may deactivate/reactivate someone else's pet
            if (isset($data['is_active']) && !$request->user()->isAdmin() && $pet->owner_id !== $request->user()->id) {
                unset($data['is_active']);
            }

            $pet->update($data);

            ActivityLog::record($request->user(), 'updated_pet', $pet, $old, $pet->fresh()->toArray());

            return response()->json([
                'success' => true,
                'data'    => $pet->fresh('owner')->append(['photo_url', 'age', 'age_label']),
                'message' => 'Pet updated successfully.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Pet not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error updating pet: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update pet', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // destroy — pet's owner or Admin (soft delete)
    // =========================================================================

    public function destroy(Request $request, $id)
    {
        try {
            $pet = Pet::findOrFail($id);

            if (!$this->canManage($request, $pet)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $name = $pet->name;
            $pet->delete();

            ActivityLog::record($request->user(), 'deleted_pet', $pet);

            return response()->json(['success' => true, 'message' => "\"{$name}\" removed."]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Pet not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting pet: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to remove pet', 'error' => $e->getMessage()], 500);
        }
    }
}
