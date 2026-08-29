<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A medical record entry for a Pet, written by a Veterinarian.
 *
 * @property int      $id
 * @property int      $pet_id
 * @property int      $veterinarian_id
 * @property int|null $appointment_id
 * @property \Carbon\Carbon $visit_date
 */
class PetMedicalRecord extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'pet_id',
        'veterinarian_id',
        'appointment_id',
        'service_type',
        'visit_date',
        'weight_kg',
        'temperature_c',
        'symptoms',
        'diagnosis',
        'treatment',
        'prescription',
        'lab_results',
        'attachments',
        'notes',
        'follow_up_date',
    ];

    protected function casts(): array
    {
        return [
            'visit_date'     => 'date:Y-m-d',
            'follow_up_date' => 'date:Y-m-d',
            'weight_kg'      => 'decimal:2',
            'temperature_c'  => 'decimal:2',
            'attachments'    => 'array',
            'created_at'     => 'datetime',
            'updated_at'     => 'datetime',
            'deleted_at'     => 'datetime',
        ];
    }

    // ============================
    // Relationships
    // ============================

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }

    public function veterinarian()
    {
        return $this->belongsTo(User::class, 'veterinarian_id');
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    // ============================
    // Scopes
    // ============================

    public function scopeForPet($query, int $petId)
    {
        return $query->where('pet_id', $petId);
    }

    public function scopeNeedingFollowUp($query)
    {
        return $query->whereNotNull('follow_up_date')
                     ->where('follow_up_date', '>=', now()->toDateString());
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('diagnosis', 'like', "%{$search}%")
              ->orWhere('treatment', 'like', "%{$search}%")
              ->orWhere('symptoms', 'like', "%{$search}%");
        });
    }

    // ============================
    // Helper Methods
    // ============================

    public function hasFollowUp(): bool
    {
        return !is_null($this->follow_up_date);
    }

    public function hasAttachments(): bool
    {
        return !empty($this->attachments);
    }

    public function getAttachmentUrls(): array
    {
        return collect($this->attachments ?? [])
            ->map(fn ($path) => asset('storage/' . $path))
            ->all();
    }
}