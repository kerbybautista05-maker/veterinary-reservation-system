<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A single login attempt record.
 *
 * @property int         $id
 * @property int|null    $user_id
 * @property string|null $email
 * @property string      $status
 */
class LoginLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'email',
        'status',
        'ip_address',
        'user_agent',
        'logged_in_at',
    ];

    protected function casts(): array
    {
        return [
            'logged_in_at' => 'datetime',
            'created_at'   => 'datetime',
            'updated_at'   => 'datetime',
        ];
    }

    // ============================
    // Constants
    // ============================

    const STATUS_SUCCESS = 'success';
    const STATUS_FAILED  = 'failed';

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

    public function scopeSuccessful($query)
    {
        return $query->where('status', self::STATUS_SUCCESS);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeFromIp($query, string $ip)
    {
        return $query->where('ip_address', $ip);
    }

    // ============================
    // Helper Methods
    // ============================

    public function isSuccessful(): bool
    {
        return $this->status === self::STATUS_SUCCESS;
    }

    // ============================
    // Static Methods
    // ============================

    public static function recordSuccess(User $user, ?string $ip = null, ?string $userAgent = null): self
    {
        return self::create([
            'user_id'      => $user->id,
            'email'        => $user->email,
            'status'       => self::STATUS_SUCCESS,
            'ip_address'   => $ip ?? request()?->ip(),
            'user_agent'   => $userAgent ?? request()?->userAgent(),
            'logged_in_at' => now(),
        ]);
    }

    public static function recordFailure(string $email, ?string $ip = null, ?string $userAgent = null): self
    {
        return self::create([
            'user_id'      => null,
            'email'        => $email,
            'status'       => self::STATUS_FAILED,
            'ip_address'   => $ip ?? request()?->ip(),
            'user_agent'   => $userAgent ?? request()?->userAgent(),
            'logged_in_at' => now(),
        ]);
    }

    public static function getRecentFailedAttempts(string $email, int $minutes = 15): int
    {
        return self::failed()
            ->where('email', $email)
            ->where('logged_in_at', '>=', now()->subMinutes($minutes))
            ->count();
    }
}
