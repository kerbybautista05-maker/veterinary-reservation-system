<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\User;
use App\Models\VeterinarianProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Http; 
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private function adminOnly(Request $request): ?\Illuminate\Http\JsonResponse
    {
        if (!$request->user()?->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized: Admin access required.'], 403);
        }
        return null;
    }

    private function storeProfilePhoto(Request $request, User $user): ?string
    {
        if (!$request->hasFile('profile_photo')) return null;

        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
        }

        return $request->file('profile_photo')->store('profile-photos', 'public');
    }

    private function removeProfilePhoto(User $user): void
    {
        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
            $user->update(['profile_photo_path' => null]);
        }
    }

    // =========================================================================
    // index — list users (Admin only)
    // GET /api/users?role=pet_owner&approval_status=pending&search=...
    // =========================================================================

    public function index(Request $request)
    {
        try {
            $guard = $this->adminOnly($request);
            if ($guard) {
                return $request->expectsJson() ? $guard : back()->with('error', 'Unauthorized access');
            }

            $query = User::query()->with('veterinarianProfile');

            if ($role = $request->input('role')) {
                $query->where('role', $role);
            }

            if ($status = $request->input('approval_status')) {
                $query->where('approval_status', $status);
            }

            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $query->orderByDesc('created_at');

            $perPage = $request->input('per_page', 15);
            $users   = $query->paginate($perPage);

            $users->getCollection()->each(fn (User $u) => $u->append(['name', 'full_name', 'profile_photo_url']));

            if ($request->expectsJson()) {
                return response()->json([
                    'success'    => true,
                    'data'       => $users->items(),
                    'pagination' => [
                        'current_page' => $users->currentPage(),
                        'last_page'    => $users->lastPage(),
                        'per_page'     => $users->perPage(),
                        'total'        => $users->total(),
                    ],
                ]);
            }

            return Inertia::render('Users/Index', ['users' => $users]);

        } catch (\Exception $e) {
            Log::error('Error fetching users: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve users', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // show — view a single user (Admin only)
    // =========================================================================

    public function show(Request $request, $id)
    {
        try {
            $guard = $this->adminOnly($request);
            if ($guard) return $guard;

            $user = User::with('veterinarianProfile')->findOrFail($id);
            $user->append(['name', 'full_name', 'profile_photo_url']);

            return response()->json(['success' => true, 'data' => $user]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }
    }

    // =========================================================================
    // store — Admin creates a Veterinarian or Admin account directly
    // (Pet Owners self-register through AuthController::register instead.)
    // =========================================================================

    public function store(Request $request)
    {
        try {
            $guard = $this->adminOnly($request);
            if ($guard) return $guard;

            $validator = Validator::make($request->all(), [
                'last_name'    => 'required|string|max:100',
                'first_name'   => 'required|string|max:100',
                'middle_name'  => 'nullable|string|max:100',
                'suffix'       => 'nullable|string|max:20',
                'email'        => 'required|email|unique:users,email',
                'phone_number' => 'nullable|string|max:30',
                'address'      => 'nullable|string',
                'password'     => 'required|string|min:8|confirmed',
                'role'         => ['required', Rule::in([User::ROLE_VETERINARIAN, User::ROLE_ADMIN])],
                'profile_photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:3072',

                // Veterinarian-specific
                'license_number'       => 'nullable|string|max:100',
                'specialization'       => 'nullable|string|max:150',
                'bio'                  => 'nullable|string',
                'years_of_experience'  => 'nullable|integer|min:0',
                'working_days'         => 'nullable|array',
                'shift_start'          => 'nullable|date_format:H:i',
                'shift_end'            => 'nullable|date_format:H:i',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $data = $validator->validated();
            $data['password']         = Hash::make($data['password']);
            $data['approval_status']  = User::APPROVAL_APPROVED; // admin-created accounts are pre-approved
            $data['approved_by']      = $request->user()->id;
            $data['approved_at']      = now();
            $data['is_active']        = true;

            if ($request->hasFile('profile_photo')) {
                $data['profile_photo_path'] = $request->file('profile_photo')->store('profile-photos', 'public');
            }

            $vetFields = array_intersect_key($data, array_flip([
                'license_number', 'specialization', 'bio', 'years_of_experience',
                'working_days', 'shift_start', 'shift_end',
            ]));
            $data = array_diff_key($data, $vetFields);
            unset($data['password_confirmation']);

            $user = User::create($data);

            if ($user->role === User::ROLE_VETERINARIAN) {
                VeterinarianProfile::create(array_merge(['user_id' => $user->id], $vetFields));
            }

            ActivityLog::record($request->user(), 'created_user_account', $user, null, $user->toArray());

            return response()->json([
                'success' => true,
                'data'    => $user->fresh('veterinarianProfile')->append(['name', 'full_name', 'profile_photo_url']),
                'message' => 'Account created successfully.',
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating user: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to create account', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // update — Admin updates any account, or a user updates their own profile
    // =========================================================================

    public function update(Request $request, $id)
    {
        try {
            $authUser   = $request->user();
            $targetUser = User::findOrFail($id);

            $isSelf = $authUser->id === $targetUser->id;
            if (!$isSelf && !$authUser->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $rules = [
                'last_name'    => 'sometimes|required|string|max:100',
                'first_name'   => 'sometimes|required|string|max:100',
                'middle_name'  => 'nullable|string|max:100',
                'suffix'       => 'nullable|string|max:20',
                'phone_number' => 'nullable|string|max:30',
                'address'      => 'nullable|string',
                'profile_photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:3072',
                'remove_photo' => 'sometimes|boolean',
            ];

            // Only admins may change email, role, or active status
            if ($authUser->isAdmin()) {
                $rules['email']     = ['sometimes', 'required', 'email', Rule::unique('users', 'email')->ignore($targetUser->id)];
                $rules['role']      = ['sometimes', Rule::in(User::getRoles())];
                $rules['is_active'] = 'sometimes|boolean';
            }

            $validator = Validator::make($request->all(), $rules);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $old  = $targetUser->toArray();
            $data = $validator->validated();

            if ($request->hasFile('profile_photo')) {
                $data['profile_photo_path'] = $this->storeProfilePhoto($request, $targetUser);
            } elseif ($request->boolean('remove_photo')) {
                $this->removeProfilePhoto($targetUser);
            }
            unset($data['profile_photo'], $data['remove_photo']);

            $targetUser->update($data);

            ActivityLog::record($authUser, 'updated_user_account', $targetUser, $old, $targetUser->fresh()->toArray());

            return response()->json([
                'success' => true,
                'data'    => $targetUser->fresh('veterinarianProfile')->append(['name', 'full_name', 'profile_photo_url']),
                'message' => 'Account updated successfully.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'User not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error updating user: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update account', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // changePassword — self-service password change
    // =========================================================================

    public function changePassword(Request $request)
    {
        try {
            $user = $request->user();

            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'password'         => 'required|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            if (!Hash::check($request->input('current_password'), $user->password)) {
                return response()->json(['success' => false, 'message' => 'Current password is incorrect.'], 422);
            }

            $user->update(['password' => Hash::make($request->input('password'))]);
            ActivityLog::record($user, 'changed_password', $user);

            return response()->json(['success' => true, 'message' => 'Password updated successfully.']);

        } catch (\Exception $e) {
            Log::error('Error changing password: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to change password.'], 500);
        }
    }

    // =========================================================================
    // approve — Admin approves a pending Pet Owner account
    // =========================================================================

    public function approve(Request $request, $id)
    {
        try {
            $guard = $this->adminOnly($request);
            if ($guard) return $guard;

            $targetUser = User::findOrFail($id);

            if (!$targetUser->isPendingApproval()) {
                return response()->json(['success' => false, 'message' => 'This account is not pending approval.'], 422);
            }

            $targetUser->approve($request->user());

            ActivityLog::record($request->user(), 'approved_user_account', $targetUser);

            Notification::notify(
                $targetUser,
                'Account Approved',
                'Your account has been approved. You can now log in and book appointments.',
                Notification::TYPE_ACCOUNT_APPROVAL,
                Notification::CHANNEL_APP // dedicated richer email sent separately below — avoid double-emailing
            );

            try {
    $this->sendAccountStatusEmail($targetUser, true);
} catch (\Throwable $e) {
    Log::error('Account approval email failed', [
        'user_id' => $targetUser->id,
        'email' => $targetUser->email,
        'error' => $e->getMessage(),
    ]);
}

            return response()->json([
                'success' => true,
                'data'    => $targetUser->fresh(),
                'message' => 'Account approved successfully.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'User not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error approving account: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to approve account.'], 500);
        }
    }

    // =========================================================================
    // reject — Admin rejects a pending Pet Owner account
    // =========================================================================

    public function reject(Request $request, $id)
    {
        try {
            $guard = $this->adminOnly($request);
            if ($guard) return $guard;

            $validator = Validator::make($request->all(), [
                'reason' => 'nullable|string|max:255',
            ]);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $targetUser = User::findOrFail($id);
            $targetUser->reject($request->user(), $request->input('reason'));

            ActivityLog::record($request->user(), 'rejected_user_account', $targetUser);

            Notification::notify(
                $targetUser,
                'Account Application Declined',
                $request->input('reason')
                    ? "Your account application was declined: {$request->input('reason')}"
                    : 'Your account application was declined.',
                Notification::TYPE_ACCOUNT_APPROVAL,
                Notification::CHANNEL_APP // dedicated richer email sent separately below — avoid double-emailing
            );

            try {
    $this->sendAccountStatusEmail($targetUser, false, $request->input('reason'));
} catch (\Throwable $e) {
    Log::error('Account rejection email failed', [
        'user_id' => $targetUser->id,
        'email' => $targetUser->email,
        'error' => $e->getMessage(),
    ]);
}

            return response()->json([
                'success' => true,
                'data'    => $targetUser->fresh(),
                'message' => 'Account rejected.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'User not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error rejecting account: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to reject account.'], 500);
        }
    }

    // =========================================================================
    // toggleActive — Admin activates/deactivates an account
    // =========================================================================

    public function toggleActive(Request $request, $id)
    {
        try {
            $guard = $this->adminOnly($request);
            if ($guard) return $guard;

            $targetUser = User::findOrFail($id);
            $targetUser->update(['is_active' => !$targetUser->is_active]);

            ActivityLog::record(
                $request->user(),
                $targetUser->is_active ? 'activated_user_account' : 'deactivated_user_account',
                $targetUser
            );

            Notification::notify(
                $targetUser,
                $targetUser->is_active ? 'Account Activated' : 'Account Deactivated',
                $targetUser->is_active
                    ? 'Your account has been reactivated by an administrator.'
                    : 'Your account has been deactivated by an administrator.',
                Notification::TYPE_GENERAL
            );

            return response()->json([
                'success' => true,
                'data'    => $targetUser->fresh(),
                'message' => $targetUser->is_active ? 'Account activated.' : 'Account deactivated.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'User not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error toggling account status: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update account status.'], 500);
        }
    }

    // =========================================================================
    // destroy — Admin soft-deletes an account
    // =========================================================================

    public function destroy(Request $request, $id)
    {
        try {
            $guard = $this->adminOnly($request);
            if ($guard) return $guard;

            $targetUser = User::findOrFail($id);

            if ($targetUser->id === $request->user()->id) {
                return response()->json(['success' => false, 'message' => 'You cannot delete your own account.'], 422);
            }

            $name = $targetUser->full_name;
            $targetUser->delete();

            ActivityLog::record($request->user(), 'deleted_user_account', $targetUser);

            return response()->json(['success' => true, 'message' => "Account \"{$name}\" deleted."]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'User not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting user: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to delete account.'], 500);
        }
    }

    // =========================================================================
    // me — get the authenticated user's own profile
    // =========================================================================

    public function me(Request $request)
    {
        $user = $request->user()->load('veterinarianProfile');
        $user->append(['name', 'full_name', 'profile_photo_url']);

        return response()->json(['success' => true, 'data' => $user]);
    }

    // =========================================================================
    // Account status email — sent to a Pet Owner when approved/rejected
    // =========================================================================

    private function buildAccountEmailHtml(string $title, string $bodyHtml, string $preheader = ''): string
    {
        $year = date('Y');

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{$title}</title>
  <style>
    body { margin:0; padding:0; background-color:#F0F4F1; font-family:'Segoe UI',Arial,sans-serif; }
    .email-wrapper { background-color:#F0F4F1; padding:32px 16px; }
    .email-container { max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(15,60,45,0.10); }
    .email-header { background-color:#0F3C2D; padding:32px 40px 28px; text-align:center; }
    .email-header-logo { font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#8FD9B6; margin-bottom:6px; }
    .email-header-title { font-size:22px; font-weight:900; color:#ffffff; margin:0; letter-spacing:-0.3px; line-height:1.2; }
    .gold-bar { height:4px; background-color:#8FD9B6; }
    .email-body { padding:36px 40px; }
    .greeting { font-size:16px; font-weight:700; color:#0F3C2D; margin:0 0 8px; }
    .lead { font-size:14px; color:#374151; line-height:1.7; margin:0 0 24px; }
    .status-badge { display:inline-block; padding:6px 18px; border-radius:99px; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:1px; margin-bottom:20px; }
    .badge-approved { background:#D1FAE5; color:#065F46; }
    .badge-declined { background:#FEE2E2; color:#991B1B; }
    .cta-wrap { text-align:center; margin:28px 0; }
    .cta-btn { display:inline-block; background:#0F3C2D; color:#ffffff !important; text-decoration:none; font-size:14px; font-weight:700; padding:14px 36px; border-radius:12px; }
    .email-footer { background:#F8FAF9; border-top:1px solid #E5E7EB; padding:24px 40px; text-align:center; }
    .footer-brand { font-size:12px; font-weight:800; color:#0F3C2D; margin-bottom:4px; }
    .footer-copy { font-size:10px; color:#D1D5DB; margin-top:12px; }
  </style>
</head>
<body>
  <span style="display:none;font-size:1px;color:#F0F4F1;max-height:0;max-width:0;opacity:0;overflow:hidden;">{$preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="email-header-logo">Pet Care Clinic</div>
        <div class="email-header-title">{$title}</div>
      </div>
      <div class="gold-bar"></div>
      <div class="email-body">{$bodyHtml}</div>
      <div class="email-footer">
        <div class="footer-brand">Pet Care Clinic</div>
        <div class="footer-copy">&copy; {$year} Pet Care Clinic. All rights reserved.</div>
      </div>
    </div>
  </div>
</body>
</html>
HTML;
    }

    private function sendAccountStatusEmail(User $user, bool $approved, ?string $reason = null): void
{
    if (!$user->email) return;

    $name  = $user->full_name;
    $login = url('/login');

    if ($approved) {
        $body = <<<HTML
<p class="greeting">Hello, {$name}!</p>
<p class="lead">
  Good news — your <strong>Pet Care Clinic</strong> account has been
  <strong style="color:#065F46;">approved</strong>. You can now log in and start booking
  appointments for your pets.
</p>
<div style="text-align:center;margin-bottom:20px;">
  <span class="status-badge badge-approved">&#10003; Account Approved</span>
</div>
<div class="cta-wrap">
  <a href="{$login}" class="cta-btn">Log In Now &rarr;</a>
</div>
HTML;
        $subject   = 'Account Approved — Pet Care Clinic';
        $preheader = 'Your account has been approved. You can now log in.';
    } else {
        $reasonHtml = $reason ? "<p class=\"lead\">Reason: {$reason}</p>" : '';
        $body = <<<HTML
<p class="greeting">Hello, {$name},</p>
<p class="lead">
  We're sorry to let you know your <strong>Pet Care Clinic</strong> account application
  was <strong style="color:#991B1B;">not approved</strong>.
</p>
<div style="text-align:center;margin-bottom:20px;">
  <span class="status-badge badge-declined">Application Declined</span>
</div>
{$reasonHtml}
HTML;
        $subject   = 'Account Application Declined — Pet Care Clinic';
        $preheader = 'Your account application was declined.';
    }

    $html = $this->buildAccountEmailHtml($approved ? 'Account Approved' : 'Application Declined', $body, $preheader);

    // ---- Send via Brevo HTTP API (avoids SMTP port block on Render free tier) ----
    $response = Http::withHeaders([
        'api-key'      => env('BREVO_API_KEY'),
        'Content-Type' => 'application/json',
        'Accept'       => 'application/json',
    ])->post('https://api.brevo.com/v3/smtp/email', [
        'sender' => [
            'name'  => env('BREVO_SENDER_NAME', 'Pet Care Clinic'),
            'email' => env('BREVO_SENDER_EMAIL'),
        ],
        'to' => [
            ['email' => $user->email, 'name' => $name],
        ],
        'subject'     => $subject,
        'htmlContent' => $html,
    ]);

    if (!$response->successful()) {
        Log::error('Brevo email send failed', [
            'user_id' => $user->id,
            'email'   => $user->email,
            'status'  => $response->status(),
            'body'    => $response->body(),
        ]);
    }
}
}
