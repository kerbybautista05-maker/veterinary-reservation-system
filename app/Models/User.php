<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * A system user — Pet Owner, Veterinarian, or Administrator.
 *
 * @property int         $id
 * @property string      $last_name
 * @property string      $first_name
 * @property string|null $middle_name
 * @property string|null $suffix
 * @property string      $email
 * @property string      $role
 * @property string      $approval_status
 * @property bool        $is_active
 */
class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'last_name',
        'first_name',
        'middle_name',
        'suffix',
        'profile_photo_path',
        'email',
        'phone_number',
        'address',
        'password',
        'role',
        'approval_status',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = [
        'name',
        'full_name',
        'profile_photo_url',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
            'approved_at'       => 'datetime',
            'created_at'        => 'datetime',
            'updated_at'        => 'datetime',
            'deleted_at'        => 'datetime',
        ];
    }

    // ============================
    // Constants
    // ============================

    const ROLE_PET_OWNER   = 'pet_owner';
    const ROLE_VETERINARIAN = 'veterinarian';
    const ROLE_ADMIN       = 'admin';

    const APPROVAL_PENDING  = 'pending';
    const APPROVAL_APPROVED = 'approved';
    const APPROVAL_REJECTED = 'rejected';

    const SUFFIXES = ['Jr.', 'Sr.', 'II', 'III', 'IV'];

    // ============================
    // Computed Attributes
    // ============================

    public function getNameAttribute(): string
    {
        $mi  = $this->middle_name ? mb_substr($this->middle_name, 0, 1) . '.' : '';
        $sfx = $this->suffix ? ' ' . $this->suffix : '';
        $given = trim(implode(' ', array_filter([$this->first_name, $mi])));
        return trim($this->last_name . ', ' . $given . $sfx);
    }

    public function getFullNameAttribute(): string
    {
        $mi  = $this->middle_name ? mb_substr($this->middle_name, 0, 1) . '.' : '';
        $sfx = $this->suffix ? ' ' . $this->suffix : '';
        return trim(implode(' ', array_filter([$this->first_name, $mi, $this->last_name, $sfx])));
    }

    public function getProfilePhotoUrlAttribute(): ?string
    {
        return $this->profile_photo_path
            ? asset('storage/' . $this->profile_photo_path)
            : null;
    }

    // ============================
    // Relationships
    // ============================

    // ── Pet Owner-specific ──────────────────────────────────────────────────

    public function pets()
    {
        return $this->hasMany(Pet::class, 'owner_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'owner_id');
    }

    public function healthReminders()
    {
        return $this->hasMany(HealthReminder::class, 'owner_id');
    }

    public function feedbacks()
    {
        return $this->hasMany(Feedback::class, 'owner_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'owner_id');
    }

    public function chatConversations()
    {
        return $this->hasMany(ChatConversation::class, 'owner_id');
    }

    // ── Veterinarian-specific ───────────────────────────────────────────────

    public function veterinarianProfile()
    {
        return $this->hasOne(VeterinarianProfile::class);
    }

    public function vetAppointments()
    {
        return $this->hasMany(Appointment::class, 'veterinarian_id');
    }

    public function medicalRecords()
    {
        return $this->hasMany(PetMedicalRecord::class, 'veterinarian_id');
    }

    public function feedbacksReceived()
    {
        return $this->hasMany(Feedback::class, 'veterinarian_id');
    }

    // ── Admin-specific ──────────────────────────────────────────────────────

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function approvedAccounts()
    {
        return $this->hasMany(User::class, 'approved_by');
    }

    public function announcements()
    {
        return $this->hasMany(Announcement::class, 'created_by');
    }

    public function assignedChats()
    {
        return $this->hasMany(ChatConversation::class, 'admin_id');
    }

    public function feedbackResponses()
    {
        return $this->hasMany(Feedback::class, 'responded_by');
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function loginLogs()
    {
        return $this->hasMany(LoginLog::class);
    }

    // ── Shared ───────────────────────────────────────────────────────────────

    public function chatMessages()
    {
        return $this->hasMany(ChatMessage::class, 'sender_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    // ============================
    // Scopes
    // ============================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePetOwners($query)
    {
        return $query->where('role', self::ROLE_PET_OWNER);
    }

    public function scopeVeterinarians($query)
    {
        return $query->where('role', self::ROLE_VETERINARIAN);
    }

    public function scopeAdmins($query)
    {
        return $query->where('role', self::ROLE_ADMIN);
    }

    public function scopePendingApproval($query)
    {
        return $query->where('approval_status', self::APPROVAL_PENDING);
    }

    // ============================
    // Role Helpers
    // ============================

    public function isPetOwner(): bool
    {
        return $this->role === self::ROLE_PET_OWNER;
    }

    public function isVeterinarian(): bool
    {
        return $this->role === self::ROLE_VETERINARIAN;
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    // ============================
    // Approval Helpers
    // ============================

    public function isApproved(): bool
    {
        return $this->approval_status === self::APPROVAL_APPROVED;
    }

    public function isPendingApproval(): bool
    {
        return $this->approval_status === self::APPROVAL_PENDING;
    }

    public function isRejected(): bool
    {
        return $this->approval_status === self::APPROVAL_REJECTED;
    }

    public function approve(User $admin): bool
    {
        return $this->update([
            'approval_status' => self::APPROVAL_APPROVED,
            'is_active'       => true,
            'approved_by'     => $admin->id,
            'approved_at'     => now(),
            'rejection_reason' => null,
        ]);
    }

    public function reject(User $admin, ?string $reason = null): bool
    {
        return $this->update([
            'approval_status'  => self::APPROVAL_REJECTED,
            'is_active'        => false,
            'approved_by'      => $admin->id,
            'approved_at'      => now(),
            'rejection_reason' => $reason,
        ]);
    }

    // ============================
    // Notification Helpers
    // ============================

    public function getUnreadNotificationsCount(): int
    {
        return $this->notifications()->where('is_read', false)->count();
    }

    public function hasUnreadNotifications(): bool
    {
        return $this->notifications()->where('is_read', false)->exists();
    }

    // ============================
    // Dashboard Stats
    // ============================

    public function getPetOwnerDashboardStats(): array
    {
        return [
            'total_pets'             => $this->pets()->active()->count(),
            'upcoming_appointments'  => $this->appointments()
                                            ->whereIn('status', ['pending', 'confirmed'])
                                            ->where('appointment_date', '>=', Carbon::today())
                                            ->count(),
            'pending_health_reminders' => $this->healthReminders()->where('is_completed', false)->count(),
            'unread_notifications'   => $this->getUnreadNotificationsCount(),
        ];
    }

    public function getVeterinarianDashboardStats(): array
    {
        $today = Carbon::today();

        return [
            'todays_appointments' => $this->vetAppointments()
                                        ->whereDate('appointment_date', $today)
                                        ->count(),
            'pending_appointments' => $this->vetAppointments()
                                        ->where('status', 'pending')
                                        ->count(),
            'total_patients'       => $this->medicalRecords()->distinct('pet_id')->count('pet_id'),
            'unread_notifications' => $this->getUnreadNotificationsCount(),
        ];
    }

    public function getAdminDashboardStats(): array
    {
        return [
            'pending_account_approvals' => self::pendingApproval()->petOwners()->count(),
            'total_pet_owners'          => self::petOwners()->active()->count(),
            'total_veterinarians'       => self::veterinarians()->active()->count(),
            'unread_notifications'      => $this->getUnreadNotificationsCount(),
        ];
    }

    // ============================
    // Static Methods
    // ============================

    public static function getRoles(): array
    {
        return [self::ROLE_PET_OWNER, self::ROLE_VETERINARIAN, self::ROLE_ADMIN];
    }
}
