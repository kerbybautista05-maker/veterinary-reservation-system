<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A health reminder (vaccination, deworming, checkup, etc.) for a Pet.
 *
 * @property int    $id
 * @property int    $pet_id
 * @property int    $owner_id
 * @property string $type
 * @property string $title
 * @property \Carbon\Carbon $due_date
 * @property bool   $is_completed
 */
class HealthReminder extends Model
{
    use HasFactory;

    protected $fillable = [
        'pet_id',
        'owner_id',
        'created_by',
        'type',
        'title',
        'description',
        'due_date',
        'is_recurring',
        'recurrence_interval_days',
        'is_completed',
        'completed_at',
        'reminder_sent',
        'reminder_sent_at',
    ];

    protected $appends = [
        'is_overdue',
    ];

    protected function casts(): array
    {
        return [
            'due_date'                  => 'date:Y-m-d',
            'is_recurring'              => 'boolean',
            'recurrence_interval_days'  => 'integer',
            'is_completed'              => 'boolean',
            'completed_at'              => 'datetime',
            'reminder_sent'             => 'boolean',
            'reminder_sent_at'          => 'datetime',
            'created_at'                => 'datetime',
            'updated_at'                => 'datetime',
        ];
    }

    // ============================
    // Constants
    // ============================

    const TYPE_VACCINATION = 'vaccination';
    const TYPE_DEWORMING   = 'deworming';
    const TYPE_CHECKUP     = 'checkup';
    const TYPE_MEDICATION  = 'medication';
    const TYPE_GROOMING    = 'grooming';
    const TYPE_OTHER       = 'other';

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

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ============================
    // Scopes
    // ============================

    public function scopePending($query)
    {
        return $query->where('is_completed', false);
    }

    public function scopeCompleted($query)
    {
        return $query->where('is_completed', true);
    }

    public function scopeOverdue($query)
    {
        return $query->where('is_completed', false)
                     ->where('due_date', '<', Carbon::today());
    }

    public function scopeDueSoon($query, int $days = 7)
    {
        return $query->where('is_completed', false)
                     ->whereBetween('due_date', [Carbon::today(), Carbon::today()->addDays($days)]);
    }

    public function scopeNeedingReminderEmail($query)
    {
        return $query->where('is_completed', false)
                     ->where('reminder_sent', false)
                     ->where('due_date', '<=', Carbon::today()->addDays(3));
    }

    // ============================
    // Accessors
    // ============================

    public function getIsOverdueAttribute(): bool
    {
        return !$this->is_completed && $this->due_date && $this->due_date->isPast();
    }

    // ============================
    // Helper Methods
    // ============================

    public function markCompleted(): bool
    {
        $ok = $this->update([
            'is_completed' => true,
            'completed_at' => now(),
        ]);

        if ($ok && $this->is_recurring && $this->recurrence_interval_days) {
            self::create([
                'pet_id'                   => $this->pet_id,
                'owner_id'                 => $this->owner_id,
                'created_by'               => $this->created_by,
                'type'                     => $this->type,
                'title'                    => $this->title,
                'description'              => $this->description,
                'due_date'                 => Carbon::today()->addDays($this->recurrence_interval_days),
                'is_recurring'             => true,
                'recurrence_interval_days' => $this->recurrence_interval_days,
            ]);
        }

        return $ok;
    }

    public function markReminderSent(): bool
    {
        return $this->update([
            'reminder_sent'    => true,
            'reminder_sent_at' => now(),
        ]);
    }

    public function isOverdue(): bool
    {
        return $this->getIsOverdueAttribute();
    }
}