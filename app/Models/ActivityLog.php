<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A single audit-trail entry recording a change made by a User.
 *
 * @property int         $id
 * @property int|null    $user_id
 * @property string      $action
 * @property string|null $subject_type
 * @property int|null    $subject_id
 */
class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'subject_type',
        'subject_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    // ============================
    // Relationships
    // ============================

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function subject()
    {
        return $this->morphTo();
    }

    // ============================
    // Scopes
    // ============================

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForSubject($query, string $subjectType, int $subjectId)
    {
        return $query->where('subject_type', $subjectType)->where('subject_id', $subjectId);
    }

    public function scopeAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    // ============================
    // Static Methods
    // ============================

    public static function record(
        ?User $user,
        string $action,
        ?Model $subject = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): self {
        return self::create([
            'user_id'      => $user?->id,
            'action'       => $action,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id'   => $subject?->getKey(),
            'old_values'   => $oldValues,
            'new_values'   => $newValues,
            'ip_address'   => request()?->ip(),
            'user_agent'   => request()?->userAgent(),
        ]);
    }
}
