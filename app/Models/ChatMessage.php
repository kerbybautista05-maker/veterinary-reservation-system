<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A single message within a ChatConversation.
 *
 * @property int    $id
 * @property int    $conversation_id
 * @property int    $sender_id
 * @property string|null $message
 * @property bool   $is_read
 */
class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'message',
        'attachment_path',
        'attachment_name',
        'is_read',
        'read_at',
    ];

    protected $appends = [
        'attachment_url',
    ];

    protected function casts(): array
    {
        return [
            'is_read'    => 'boolean',
            'read_at'    => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    // ============================
    // Relationships
    // ============================

    public function conversation()
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    // ============================
    // Scopes
    // ============================

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    // ============================
    // Accessors
    // ============================

    public function getAttachmentUrlAttribute(): ?string
    {
        return $this->attachment_path ? asset('storage/' . $this->attachment_path) : null;
    }

    // ============================
    // Helper Methods
    // ============================

    public function hasAttachment(): bool
    {
        return !empty($this->attachment_path);
    }

    public function markAsRead(): bool
    {
        return $this->update(['is_read' => true, 'read_at' => now()]);
    }

    protected static function booted(): void
    {
        static::created(function (ChatMessage $message) {
            $message->conversation()->update(['last_message_at' => $message->created_at ?? now()]);
        });
    }
}
