<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Pet Owner feedback about an appointment / veterinarian.
 *
 * @property int      $id
 * @property int      $owner_id
 * @property int|null $appointment_id
 * @property int|null $veterinarian_id
 * @property int      $rating
 * @property bool     $is_published
 */
class Feedback extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Eloquent pluralizes 'Feedback' to 'feedback' (it's on the uncountable
     * word list), but the migration created the table as 'feedbacks'. Without
     * this, every query 42S02s with "table 'feedback' not found".
     */
    protected $table = 'feedbacks';

    protected $fillable = [
        'owner_id',
        'appointment_id',
        'veterinarian_id',
        'rating',
        'comment',
        'is_published',
        'responded_by',
        'admin_response',
        'responded_at',
    ];

    protected function casts(): array
    {
        return [
            'rating'        => 'integer',
            'is_published'  => 'boolean',
            'responded_at'  => 'datetime',
            'created_at'    => 'datetime',
            'updated_at'    => 'datetime',
            'deleted_at'    => 'datetime',
        ];
    }

    // ============================
    // Relationships
    // ============================

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function veterinarian()
    {
        return $this->belongsTo(User::class, 'veterinarian_id');
    }

    public function respondedBy()
    {
        return $this->belongsTo(User::class, 'responded_by');
    }

    // ============================
    // Scopes
    // ============================

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeUnanswered($query)
    {
        return $query->whereNull('admin_response');
    }

    public function scopeForVeterinarian($query, int $vetId)
    {
        return $query->where('veterinarian_id', $vetId);
    }

    public function scopeMinRating($query, int $rating)
    {
        return $query->where('rating', '>=', $rating);
    }

    // ============================
    // Accessors
    // ============================

    public function getStarsAttribute(): string
    {
        return str_repeat('★', $this->rating) . str_repeat('☆', 5 - $this->rating);
    }

    // ============================
    // Helper Methods
    // ============================

    public function hasResponse(): bool
    {
        return !empty($this->admin_response);
    }

    public function respond(User $admin, string $response): bool
    {
        return $this->update([
            'responded_by'   => $admin->id,
            'admin_response' => $response,
            'responded_at'   => now(),
        ]);
    }

    public function publish(): bool
    {
        return $this->update(['is_published' => true]);
    }

    public function hide(): bool
    {
        return $this->update(['is_published' => false]);
    }

    // ============================
    // Static Methods
    // ============================

    public static function getAverageRatingForVeterinarian(int $vetId): float
    {
        return round(self::forVeterinarian($vetId)->avg('rating') ?? 0, 1);
    }
}