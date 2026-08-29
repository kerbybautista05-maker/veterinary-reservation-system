<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Announcement;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    // Only Admin can create/update/delete announcements
    private function canManage(Request $request): ?\Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized: Admin access required.'], 403);
        }
        return null;
    }

    // Pet Owners and Veterinarians only ever see published announcements
    private function isRestrictedViewer(Request $request): bool
    {
        $user = $request->user();
        return $user && ($user->isPetOwner() || $user->isVeterinarian());
    }

    // =========================================================================
    // index — list announcements
    // - Admin: sees ALL announcements (including drafts/scheduled)
    // - Pet Owner / Veterinarian: sees ONLY published announcements
    // =========================================================================

    public function index(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }

            $query = Announcement::with('author');

            if ($this->isRestrictedViewer($request)) {
                $query->active();
            }

            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('body', 'like', "%{$search}%");
                });
            }

            $query->orderByDesc('published_at')->orderByDesc('created_at');

            $perPage = $request->input('per_page', 10);
            $records = $query->paginate($perPage);

            $records->getCollection()->each(function ($announcement) {
                $announcement->append(['image_url', 'status_label', 'status_color', 'excerpt']);
            });

            if ($request->expectsJson()) {
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
            }

            return Inertia::render('Announcements/Index', ['announcements' => $records]);

        } catch (\Exception $e) {
            Log::error('Error fetching announcements: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve announcements',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // getPublished — for Pet Owners / Veterinarians (e.g. dashboard widget)
    // =========================================================================

    public function getPublished(Request $request)
    {
        try {
            $query = Announcement::active()->with('author')
                ->orderByDesc('created_at');

            if ($limit = $request->input('limit')) {
                $query->limit($limit);
            }

            $announcements = $query->get();

            $announcements->each(function ($announcement) {
                $announcement->append(['image_url', 'excerpt']);
            });

            return response()->json(['success' => true, 'data' => $announcements]);

        } catch (\Exception $e) {
            Log::error('Error fetching published announcements: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve announcements'], 500);
        }
    }

    // =========================================================================
    // store — admin creates an announcement
    // =========================================================================

    public function store(Request $request)
    {
        try {
            $guard = $this->canManage($request);
            if ($guard) return $guard;

            $validator = Validator::make($request->all(), [
                'title'        => 'required|string|max:255',
                'body'         => 'required|string',
                'image'        => 'nullable|image|mimes:jpg,jpeg,png,webp|max:3072',
                'start_date'   => 'required|date',
                'end_date'     => 'required|date|after_or_equal:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $data               = $validator->validated();
            $data['created_by'] = $request->user()->id;
            $data['is_published'] = true;

            if ($request->hasFile('image')) {
                $data['image_path'] = $request->file('image')->store('announcements', 'public');
            }
            unset($data['image']);

            $announcement = Announcement::create($data);
            ActivityLog::record($request->user(), 'created_announcement', $announcement, null, $announcement->toArray());

            $this->notifyAudience($announcement);

            return response()->json([
                'success' => true,
                'data'    => $announcement->load('author')->append(['image_url', 'status_label', 'status_color']),
                'message' => 'Announcement created successfully.',
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating announcement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create announcement',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // show — view a single announcement
    // =========================================================================

    public function show(Request $request, $id)
    {
        try {
            $announcement = Announcement::with('author')->findOrFail($id);

            if ($this->isRestrictedViewer($request)) {
                $today = now()->toDateString();
                if ($announcement->start_date && $announcement->start_date > $today) {
                    return response()->json(['success' => false, 'message' => 'Announcement not available yet'], 403);
                }
                if ($announcement->end_date && $announcement->end_date < $today) {
                    return response()->json(['success' => false, 'message' => 'Announcement has expired'], 404);
                }
            }

            $announcement->append(['image_url', 'status_label', 'status_color', 'excerpt']);

            return response()->json(['success' => true, 'data' => $announcement]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Announcement not found'], 404);
        }
    }

    // =========================================================================
    // update — admin updates an announcement
    // =========================================================================

    public function update(Request $request, $id)
    {
        try {
            $guard = $this->canManage($request);
            if ($guard) return $guard;

            $announcement = Announcement::findOrFail($id);
            $old          = $announcement->toArray();

            $validator = Validator::make($request->all(), [
                'title'        => 'sometimes|required|string|max:255',
                'body'         => 'sometimes|required|string',
                'image'        => 'nullable|image|mimes:jpg,jpeg,png,webp|max:3072',
                'start_date'   => 'sometimes|required|date',
                'end_date'     => 'sometimes|required|date|after_or_equal:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $data                = $validator->validated();
            $data['updated_by']  = $request->user()->id;

            if ($request->hasFile('image')) {
                if ($announcement->image_path) {
                    Storage::disk('public')->delete($announcement->image_path);
                }
                $data['image_path'] = $request->file('image')->store('announcements', 'public');
            } elseif ($request->boolean('remove_image') && $announcement->image_path) {
                Storage::disk('public')->delete($announcement->image_path);
                $data['image_path'] = null;
            }
            unset($data['image']);

            $announcement->update($data);
            $fresh = $announcement->fresh()->load('author');

            ActivityLog::record($request->user(), 'updated_announcement', $fresh, $old, $fresh->toArray());

            return response()->json([
                'success' => true,
                'data'    => $fresh->append(['image_url', 'status_label', 'status_color']),
                'message' => 'Announcement updated successfully.',
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating announcement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update announcement',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // destroy — admin soft-deletes an announcement
    // =========================================================================

    public function destroy(Request $request, $id)
    {
        try {
            $guard = $this->canManage($request);
            if ($guard) return $guard;

            $announcement = Announcement::findOrFail($id);
            $title        = $announcement->title;

            if ($announcement->image_path) {
                Storage::disk('public')->delete($announcement->image_path);
            }

            $announcement->delete();

            ActivityLog::record($request->user(), 'deleted_announcement', $announcement);

            return response()->json(['success' => true, 'message' => "Announcement \"{$title}\" deleted."]);

        } catch (\Exception $e) {
            Log::error('Error deleting announcement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete announcement',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // PRIVATE — notify all active Pet Owners + Veterinarians of a new announcement
    // =========================================================================

    private function notifyAudience(Announcement $announcement): void
    {
        try {
            $recipients = User::where('is_active', true)
                ->whereIn('role', [User::ROLE_PET_OWNER, User::ROLE_VETERINARIAN])
                ->get();

            foreach ($recipients as $recipient) {
                // Owners have a per-announcement detail page; Vets only have a
                // flat listing (Vet/Announcements.tsx shows details inline via
                // an accordion, with no /vet/announcements/{id} route).
                $deepLink = $recipient->isVeterinarian()
                    ? '/vet/announcements'
                    : "/owner/announcements/{$announcement->id}";

                Notification::notify(
                    $recipient,
                    'New Announcement',
                    "New announcement: \"{$announcement->title}\" — tap to read.",
                    Notification::TYPE_ANNOUNCEMENT,
                    Notification::CHANNEL_APP,
                    $deepLink
                );
            }
        } catch (\Exception $notifEx) {
            Log::warning('Failed to send announcement notifications: ' . $notifEx->getMessage());
        }
    }
}