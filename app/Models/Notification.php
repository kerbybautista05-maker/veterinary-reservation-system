<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * An in-app / email notification sent to a User.
 *
 * @property int         $id
 * @property int         $user_id
 * @property string      $title
 * @property string      $message
 * @property string      $type
 * @property string      $channel
 * @property bool        $is_read
 */
class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'message',
        'type',
        'notifiable_type',
        'notifiable_id',
        'deep_link',
        'channel',
        'email_sent',
        'email_sent_at',
        'is_read',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'email_sent'    => 'boolean',
            'email_sent_at' => 'datetime',
            'is_read'       => 'boolean',
            'read_at'       => 'datetime',
            'created_at'    => 'datetime',
            'updated_at'    => 'datetime',
        ];
    }

    // ============================
    // Constants
    // ============================

    const TYPE_ACCOUNT_APPROVAL          = 'account_approval';
    const TYPE_APPOINTMENT_REMINDER      = 'appointment_reminder';
    const TYPE_APPOINTMENT_UPDATE        = 'appointment_update';
    const TYPE_APPOINTMENT_CANCELLATION  = 'appointment_cancellation';
    const TYPE_HEALTH_REMINDER           = 'health_reminder';
    const TYPE_PAYMENT_UPDATE            = 'payment_update';
    const TYPE_FEEDBACK_RESPONSE         = 'feedback_response';
    const TYPE_ANNOUNCEMENT              = 'announcement';
    const TYPE_GENERAL                   = 'general';

    const CHANNEL_APP   = 'app';
    const CHANNEL_EMAIL = 'email';
    const CHANNEL_BOTH  = 'both';

    // ============================
    // Relationships
    // ============================

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function notifiable()
    {
        return $this->morphTo();
    }

    // ============================
    // Scopes
    // ============================

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopePendingEmail($query)
    {
        return $query->whereIn('channel', [self::CHANNEL_EMAIL, self::CHANNEL_BOTH])
                     ->where('email_sent', false);
    }

    // ============================
    // Helper Methods
    // ============================

    public function shouldSendEmail(): bool
    {
        return in_array($this->channel, [self::CHANNEL_EMAIL, self::CHANNEL_BOTH], true);
    }

    public function markAsRead(): bool
    {
        return $this->update(['is_read' => true, 'read_at' => now()]);
    }

    public function markEmailSent(): bool
    {
        return $this->update(['email_sent' => true, 'email_sent_at' => now()]);
    }

    // ============================
    // Static Methods
    // ============================

    public static function notify(User $user, string $title, string $message, string $type = self::TYPE_GENERAL, string $channel = self::CHANNEL_BOTH, ?string $deepLink = null): self
    {
        $notification = self::create([
            'user_id'   => $user->id,
            'title'     => $title,
            'message'   => $message,
            'type'      => $type,
            'channel'   => $channel,
            'deep_link' => $deepLink,
        ]);

        if ($notification->shouldSendEmail()) {
            $sent = \App\Support\ClinicMail::send(
                $user,
                $title,
                $title,
                $message,
                $deepLink ? 'View Details' : null,
                $deepLink ? url($deepLink) : null
            );

            if ($sent) {
                $notification->markEmailSent();
            }
        }

        return $notification;
    }
}