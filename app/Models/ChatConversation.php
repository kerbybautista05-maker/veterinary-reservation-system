<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A live chat thread between a Pet Owner and an Administrator.
 *
 * @property int      $id
 * @property int      $owner_id
 * @property int|null $admin_id
 * @property string   $status
 */
class ChatConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'admin_id',
        'status',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
            'created_at'      => 'datetime',
            'updated_at'      => 'datetime',
        ];
    }

    // ============================
    // Constants
    // ============================

    const STATUS_OPEN    = 'open';
    const STATUS_PENDING = 'pending';
    const STATUS_CLOSED  = 'closed';

    // ============================
    // Relationships
    // ============================

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function messages()
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id')->orderBy('created_at');
    }

    public function latestMessage()
    {
        return $this->hasOne(ChatMessage::class, 'conversation_id')->latestOfMany();
    }

    // ============================
    // Scopes
    // ============================

    public function scopeOpen($query)
    {
        return $query->where('status', self::STATUS_OPEN);
    }

    public function scopeUnassigned($query)
    {
        return $query->whereNull('admin_id');
    }

    public function scopeForAdmin($query, int $adminId)
    {
        return $query->where('admin_id', $adminId);
    }

    // ============================
    // Helper Methods
    // ============================

    public function assignAdmin(User $admin): bool
    {
        return $this->update(['admin_id' => $admin->id, 'status' => self::STATUS_OPEN]);
    }

    public function close(): bool
    {
        return $this->update(['status' => self::STATUS_CLOSED]);
    }

    public function reopen(): bool
    {
        return $this->update(['status' => self::STATUS_OPEN]);
    }

    public function getUnreadCountFor(User $user): int
    {
        return $this->messages()
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->count();
    }

    public function markReadFor(User $user): void
    {
        $this->messages()
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);
    }
}
