<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Extended profile for a Veterinarian user.
 *
 * @property int         $id
 * @property int         $user_id
 * @property string|null $license_number
 * @property string|null $specialization
 * @property array|null  $working_days
 */
class VeterinarianProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'license_number',
        'specialization',
        'bio',
        'years_of_experience',
        'working_days',
        'shift_start',
        'shift_end',
        'is_available_for_emergency',
    ];

    protected function casts(): array
    {
        return [
            'working_days'                => 'array',
            'years_of_experience'         => 'integer',
            'is_available_for_emergency'  => 'boolean',
            'shift_start'                 => 'datetime:H:i',
            'shift_end'                   => 'datetime:H:i',
            'created_at'                  => 'datetime',
            'updated_at'                  => 'datetime',
        ];
    }

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // ============================
    // Relationships
    // ============================

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ============================
    // Scopes
    // ============================

    public function scopeAvailableForEmergency($query)
    {
        return $query->where('is_available_for_emergency', true);
    }

    public function scopeSpecializingIn($query, string $specialization)
    {
        return $query->where('specialization', 'like', "%{$specialization}%");
    }

    // ============================
    // Helper Methods
    // ============================

    public function isWorkingOn(string $dayName): bool
    {
        return in_array($dayName, $this->working_days ?? [], true);
    }

    public function isWorkingToday(): bool
    {
        return $this->isWorkingOn(Carbon::now('Asia/Manila')->format('l'));
    }

    public function isAvailableForEmergency(): bool
    {
        return (bool) $this->is_available_for_emergency;
    }

    public function getShiftLabel(): ?string
    {
        if (!$this->shift_start || !$this->shift_end) {
            return null;
        }

        return $this->shift_start->format('g:i A') . ' – ' . $this->shift_end->format('g:i A');
    }
}
