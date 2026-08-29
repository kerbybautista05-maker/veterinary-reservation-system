<?php
// app/Http/Middleware/HandleInertiaRequests.php

namespace App\Http\Middleware;

use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;
use Illuminate\Http\Request;
use App\Models\Notification;
use App\Models\User;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user('web');

        // ── Load role-specific relations ──────────────────────────────────────
        if ($user && $user->isVeterinarian()) {
            $user->loadMissing('veterinarianProfile');
        }

        // ── Unread notifications ────────────────────────────────────────────────
        $unreadNotifications = [];
        if ($user) {
            try {
                $notifications = Notification::where('user_id', $user->id)
                    ->where('is_read', false)
                    ->latest()
                    ->take(5)
                    ->get(['id', 'title', 'message', 'type', 'is_read', 'created_at', 'deep_link', 'notifiable_type', 'notifiable_id']);

                $unreadNotifications = $notifications->map(fn ($n) => [
                    'id'         => $n->id,
                    'title'      => $n->title,
                    'message'    => $n->message,
                    'type'       => $n->type,
                    'is_read'    => $n->is_read,
                    'created_at' => $n->created_at,
                    'deep_link'  => $n->deep_link,
                ])->values()->toArray();

                // Synthetic reminder for Admins: pending Pet Owner approvals, mirroring
                // how the old app surfaced a pending-leave-requests banner for staff.
                if ($user->isAdmin()) {
                    $pendingCount = User::pendingApproval()->petOwners()->count();
                    if ($pendingCount > 0 && count($unreadNotifications) < 5) {
                        $alreadyShown = collect($unreadNotifications)->contains(
                            fn ($n) => str_contains($n['message'] ?? '', 'pending approval')
                        );
                        if (!$alreadyShown) {
                            $unreadNotifications[] = [
                                'id'         => 0,
                                'title'      => 'Pending Account Approvals',
                                'message'    => "You have {$pendingCount} pet owner account(s) awaiting approval.",
                                'type'       => 'account_approval',
                                'is_read'    => false,
                                'created_at' => now()->toISOString(),
                                'deep_link'  => '/admin/approvals',
                            ];
                        }
                    }
                }
            } catch (\Exception $e) {
                \Log::error('Error loading notifications: ' . $e->getMessage());
                $unreadNotifications = [];
            }
        }

        // ── Build user array ──────────────────────────────────────────────────
        $userArray = null;
        if ($user) {
            $userArray = [
                'id'                => $user->id,
                'last_name'         => $user->last_name,
                'first_name'        => $user->first_name,
                'middle_name'       => $user->middle_name,
                'suffix'            => $user->suffix,
                'name'              => $user->name,
                'full_name'         => $user->full_name,
                'profile_photo_url' => $user->profile_photo_url,
                'email'             => $user->email,
                'phone_number'      => $user->phone_number,
                'address'           => $user->address,
                'role'              => $user->role,
                'approval_status'   => $user->approval_status,
                'is_active'         => $user->is_active,
            ];

            if ($user->isVeterinarian() && $user->relationLoaded('veterinarianProfile')) {
                $profile = $user->veterinarianProfile;
                $userArray['veterinarian_profile'] = $profile ? [
                    'id'                          => $profile->id,
                    'license_number'              => $profile->license_number,
                    'specialization'              => $profile->specialization,
                    'bio'                         => $profile->bio,
                    'years_of_experience'         => $profile->years_of_experience,
                    'working_days'                => $profile->working_days,
                    'shift_start'                 => $profile->shift_start,
                    'shift_end'                   => $profile->shift_end,
                    'is_available_for_emergency'  => $profile->is_available_for_emergency,
                ] : null;
            }
        }

        return array_merge(parent::share($request), [
            'auth'                => [
                'user' => $userArray,
            ],
            'ziggy'               => fn () => array_merge((new Ziggy)->toArray(), ['location' => $request->url()]),
            'unreadNotifications' => $unreadNotifications,
        ]);
    }
}