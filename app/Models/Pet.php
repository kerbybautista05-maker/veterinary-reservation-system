<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A pet belonging to a Pet Owner.
 *
 * @property int         $id
 * @property int         $owner_id
 * @property string      $name
 * @property string      $species
 * @property string|null $breed
 * @property string      $sex
 * @property \Carbon\Carbon|null $birth_date
 * @property bool        $is_active
 */
class Pet extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'owner_id',
        'name',
        'species',
        'breed',
        'sex',
        'birth_date',
        'weight_kg',
        'color',
        'photo_path',
        'microchip_id',
        'is_neutered_or_spayed',
        'allergies',
        'notes',
        'is_active',
    ];

    protected $appends = [
        'photo_url',
        'age',
        'age_label',
    ];

    protected function casts(): array
    {
        return [
            'birth_date'             => 'date:Y-m-d',
            'weight_kg'               => 'decimal:2',
            'is_neutered_or_spayed'   => 'boolean',
            'is_active'               => 'boolean',
            'created_at'              => 'datetime',
            'updated_at'              => 'datetime',
            'deleted_at'              => 'datetime',
        ];
    }

    // ============================
    // Constants
    // ============================

    const SEX_MALE    = 'male';
    const SEX_FEMALE  = 'female';
    const SEX_UNKNOWN = 'unknown';

    // ============================
    // Relationships
    // ============================

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function medicalRecords()
    {
        return $this->hasMany(PetMedicalRecord::class);
    }

    public function healthReminders()
    {
        return $this->hasMany(HealthReminder::class);
    }

    public function latestMedicalRecord()
    {
        return $this->hasOne(PetMedicalRecord::class)->latestOfMany('visit_date');
    }

    public function upcomingAppointment()
    {
        return $this->hasOne(Appointment::class)
            ->whereIn('status', ['pending', 'confirmed'])
            ->where('appointment_date', '>=', Carbon::today())
            ->oldestOfMany('appointment_date');
    }

    // ============================
    // Scopes
    // ============================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSpecies($query, string $species)
    {
        return $query->where('species', $species);
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('breed', 'like', "%{$search}%")
              ->orWhere('microchip_id', 'like', "%{$search}%");
        });
    }

    // ============================
    // Accessors
    // ============================

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo_path ? asset('storage/' . $this->photo_path) : null;
    }

    public function getAgeAttribute(): ?int
    {
        return $this->birth_date?->age;
    }

    public function getAgeLabelAttribute(): ?string
    {
        if (!$this->birth_date) {
            return null;
        }

        $years = $this->birth_date->diffInYears(Carbon::now());
        $months = $this->birth_date->diffInMonths(Carbon::now()) % 12;

        if ($years < 1) {
            return $months . ' month' . ($months === 1 ? '' : 's');
        }

        return $years . ' year' . ($years === 1 ? '' : 's')
            . ($months > 0 ? ', ' . $months . ' month' . ($months === 1 ? '' : 's') : '');
    }

    // ============================
    // Helper Methods
    // ============================

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    public function activate(): bool
    {
        return $this->update(['is_active' => true]);
    }

    public function deactivate(): bool
    {
        return $this->update(['is_active' => false]);
    }

    public function hasUpcomingAppointment(): bool
    {
        return $this->appointments()
            ->whereIn('status', ['pending', 'confirmed'])
            ->where('appointment_date', '>=', Carbon::today())
            ->exists();
    }

    public function getPendingHealthRemindersCount(): int
    {
        return $this->healthReminders()->where('is_completed', false)->count();
    }

    // ============================
    // Static Methods
    // ============================

    public static function getActivePetsForOwner(int $ownerId): \Illuminate\Support\Collection
    {
        return self::active()
            ->where('owner_id', $ownerId)
            ->orderBy('name')
            ->get();
    }
}