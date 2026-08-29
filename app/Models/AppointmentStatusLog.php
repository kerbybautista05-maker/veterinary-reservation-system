<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A single status transition recorded against an Appointment (audit trail).
 *
 * @property int         $id
 * @property int         $appointment_id
 * @property int|null    $changed_by
 * @property string|null $from_status
 * @property string      $to_status
 */
class AppointmentStatusLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'changed_by',
        'from_status',
        'to_status',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    // ============================
    // Relationships
    // ============================

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    // ============================
    // Accessors
    // ============================

    public function getTransitionLabelAttribute(): string
    {
        $from = $this->from_status ? ucwords(str_replace('_', ' ', $this->from_status)) : 'New';
        $to   = ucwords(str_replace('_', ' ', $this->to_status));

        return "{$from} → {$to}";
    }
}
