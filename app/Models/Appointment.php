<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A booked visit for a Pet with a Veterinarian.
 *
 * @property int         $id
 * @property int         $pet_id
 * @property int         $owner_id
 * @property int|null    $veterinarian_id
 * @property \Carbon\Carbon $appointment_date
 * @property string      $appointment_time
 * @property string      $type
 * @property string      $status
 */
class Appointment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'pet_id',
        'owner_id',
        'veterinarian_id',
        'appointment_date',
        'appointment_time',
        'duration_minutes',
        'type',
        'status',
        'service_type',
        'reason',
        'cancellation_reason',
        'cancelled_at',
        'cancelled_by',
        'rescheduled_from_id',
        'notes',
    ];

    protected $appends = [
        'status_label',
        'status_color',
        'is_emergency',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'date:Y-m-d',
            'duration_minutes' => 'integer',
            'cancelled_at'     => 'datetime',
            'created_at'       => 'datetime',
            'updated_at'       => 'datetime',
            'deleted_at'       => 'datetime',
        ];
    }

    // ============================
    // Constants
    // ============================

    const TYPE_REGULAR   = 'regular';
    const TYPE_EMERGENCY = 'emergency';

    const STATUS_PENDING     = 'pending';
    const STATUS_CONFIRMED   = 'confirmed';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED   = 'completed';
    const STATUS_CANCELLED   = 'cancelled';
    const STATUS_RESCHEDULED = 'rescheduled';
    const STATUS_NO_SHOW     = 'no_show';

    const ACTIVE_STATUSES = [self::STATUS_PENDING, self::STATUS_CONFIRMED, self::STATUS_IN_PROGRESS];

    // ============================
    // Relationships
    // ============================

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function veterinarian()
    {
        return $this->belongsTo(User::class, 'veterinarian_id');
    }

    public function cancelledBy()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function rescheduledFrom()
    {
        return $this->belongsTo(Appointment::class, 'rescheduled_from_id');
    }

    public function rescheduledTo()
    {
        return $this->hasOne(Appointment::class, 'rescheduled_from_id');
    }

    public function statusLogs()
    {
        return $this->hasMany(AppointmentStatusLog::class);
    }

    public function medicalRecord()
    {
        return $this->hasOne(PetMedicalRecord::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function feedback()
    {
        return $this->hasOne(Feedback::class);
    }

    // ============================
    // Scopes
    // ============================

    public function scopeUpcoming($query)
    {
        return $query->whereIn('status', self::ACTIVE_STATUSES)
                     ->where('appointment_date', '>=', Carbon::today());
    }

    public function scopePast($query)
    {
        return $query->where('appointment_date', '<', Carbon::today());
    }

    public function scopeForDate($query, $date)
    {
        return $query->whereDate('appointment_date', $date);
    }

    public function scopeEmergency($query)
    {
        return $query->where('type', self::TYPE_EMERGENCY);
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeForVeterinarian($query, int $vetId)
    {
        return $query->where('veterinarian_id', $vetId);
    }

    // ============================
    // Accessors
    // ============================

    public function getStatusLabelAttribute(): string
    {
        return ucwords(str_replace('_', ' ', $this->status));
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING     => 'yellow',
            self::STATUS_CONFIRMED   => 'blue',
            self::STATUS_IN_PROGRESS => 'indigo',
            self::STATUS_COMPLETED   => 'green',
            self::STATUS_CANCELLED   => 'red',
            self::STATUS_RESCHEDULED => 'orange',
            self::STATUS_NO_SHOW     => 'gray',
            default                  => 'gray',
        };
    }

    public function getIsEmergencyAttribute(): bool
    {
        return $this->type === self::TYPE_EMERGENCY;
    }

    // ============================
    // Helper Methods
    // ============================

    public function isPending(): bool   { return $this->status === self::STATUS_PENDING; }
    public function isConfirmed(): bool { return $this->status === self::STATUS_CONFIRMED; }
    public function isCompleted(): bool { return $this->status === self::STATUS_COMPLETED; }
    public function isCancelled(): bool { return $this->status === self::STATUS_CANCELLED; }
    public function isEmergency(): bool { return $this->type === self::TYPE_EMERGENCY; }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, self::ACTIVE_STATUSES, true);
    }

    protected function logStatusChange(string $from, string $to, ?User $changedBy = null, ?string $remarks = null): void
    {
        $this->statusLogs()->create([
            'changed_by' => $changedBy?->id,
            'from_status' => $from,
            'to_status'   => $to,
            'remarks'     => $remarks,
        ]);
    }

    public function confirm(?User $vet = null): bool
    {
        $from = $this->status;
        $ok = $this->update([
            'status' => self::STATUS_CONFIRMED,
            'veterinarian_id' => $vet?->id ?? $this->veterinarian_id,
        ]);
        if ($ok) $this->logStatusChange($from, self::STATUS_CONFIRMED, $vet);
        return $ok;
    }

    public function complete(): bool
    {
        $from = $this->status;
        $ok = $this->update(['status' => self::STATUS_COMPLETED]);
        if ($ok) $this->logStatusChange($from, self::STATUS_COMPLETED);
        return $ok;
    }

    public function cancel(User $cancelledBy, ?string $reason = null): bool
    {
        $from = $this->status;
        $ok = $this->update([
            'status'               => self::STATUS_CANCELLED,
            'cancellation_reason'  => $reason,
            'cancelled_at'         => now(),
            'cancelled_by'         => $cancelledBy->id,
        ]);
        if ($ok) $this->logStatusChange($from, self::STATUS_CANCELLED, $cancelledBy, $reason);
        return $ok;
    }

    public function markNoShow(): bool
    {
        $from = $this->status;
        $ok = $this->update(['status' => self::STATUS_NO_SHOW]);
        if ($ok) $this->logStatusChange($from, self::STATUS_NO_SHOW);
        return $ok;
    }

    /**
     * Create a new appointment as a reschedule of this one, and mark this one rescheduled.
     */
    public function rescheduleTo(string $newDate, string $newTime, ?User $changedBy = null): self
    {
        $new = self::create([
            'pet_id'           => $this->pet_id,
            'owner_id'         => $this->owner_id,
            'veterinarian_id'  => $this->veterinarian_id,
            'appointment_date' => $newDate,
            'appointment_time' => $newTime,
            'duration_minutes' => $this->duration_minutes,
            'type'             => $this->type,
            'status'           => self::STATUS_PENDING,
            'service_type'     => $this->service_type,
            'reason'           => $this->reason,
            'rescheduled_from_id' => $this->id,
        ]);

        $from = $this->status;
        $this->update(['status' => self::STATUS_RESCHEDULED]);
        $this->logStatusChange($from, self::STATUS_RESCHEDULED, $changedBy, 'Rescheduled to appointment #' . $new->id);

        return $new;
    }
}