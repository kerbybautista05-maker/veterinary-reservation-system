<?php

namespace App\Traits;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasCommentNotifications
{
    /**
     * Get the comments relationship for this model.
     * Override this in your model if the relationship name is different.
     * 
     * @return MorphMany
     */
    public function comments(): MorphMany
    {
        // This assumes your model has a morphMany relationship to comments
        // Override this method in your model if needed
        return $this->morphMany(\App\Models\ContractDocumentComment::class, 'commentable');
    }

    /**
     * Notify all commenters on this model except the current user
     * 
     * @param User $excludeUser User to exclude from notifications
     * @param string $message Notification message
     * @param string $title Notification title
     * @param string $channel Notification channel (app, email, both)
     * @return int Number of users notified
     */
    public function notifyCommentersExcept(
        User $excludeUser, 
        string $message, 
        string $title = 'New Activity',
        string $channel = Notification::CHANNEL_APP
    ): int {
        if (!method_exists($this, 'comments')) {
            Log::warning('Model does not have a comments relationship: ' . get_class($this));
            return 0;
        }

        $commenterIds = $this->comments()
            ->distinct('teacher_id')
            ->pluck('teacher_id')
            ->toArray();

        $commenterIds = array_filter($commenterIds, fn($id) => $id !== $excludeUser->id);

        $notified = 0;
        foreach ($commenterIds as $userId) {
            try {
                Notification::send(
                    $userId,
                    Notification::TYPE_GENERAL,
                    $message,
                    $title,
                    $channel,
                    get_class($this),
                    $this->id
                );
                $notified++;
            } catch (\Exception $e) {
                Log::warning("Failed to notify commenter #{$userId}: " . $e->getMessage());
            }
        }

        return $notified;
    }

    /**
     * Notify all commenters on this model (including the owner)
     * 
     * @param string $message Notification message
     * @param string $title Notification title
     * @param string $channel Notification channel
     * @return int Number of users notified
     */
    public function notifyAllCommenters(
        string $message, 
        string $title = 'New Activity',
        string $channel = Notification::CHANNEL_APP
    ): int {
        if (!method_exists($this, 'comments')) {
            Log::warning('Model does not have a comments relationship: ' . get_class($this));
            return 0;
        }

        $commenterIds = $this->comments()
            ->distinct('teacher_id')
            ->pluck('teacher_id')
            ->toArray();

        $notified = 0;
        foreach ($commenterIds as $userId) {
            try {
                Notification::send(
                    $userId,
                    Notification::TYPE_GENERAL,
                    $message,
                    $title,
                    $channel,
                    get_class($this),
                    $this->id
                );
                $notified++;
            } catch (\Exception $e) {
                Log::warning("Failed to notify commenter #{$userId}: " . $e->getMessage());
            }
        }

        return $notified;
    }

    /**
     * Notify specific commenters based on criteria
     * 
     * @param User $excludeUser User to exclude
     * @param array $userIds Specific users to notify (if empty, notifies all commenters)
     * @param string $message Notification message
     * @param string $title Notification title
     * @param string $channel Notification channel
     * @return int Number of users notified
     */
    public function notifySpecificCommenters(
        User $excludeUser,
        array $userIds,
        string $message,
        string $title = 'New Activity',
        string $channel = Notification::CHANNEL_APP
    ): int {
        if (!method_exists($this, 'comments')) {
            Log::warning('Model does not have a comments relationship: ' . get_class($this));
            return 0;
        }

        // If no specific users provided, get all commenters
        if (empty($userIds)) {
            return $this->notifyCommentersExcept($excludeUser, $message, $title, $channel);
        }

        $notified = 0;
        foreach ($userIds as $userId) {
            // Skip the excluded user
            if ($userId === $excludeUser->id) {
                continue;
            }
            
            try {
                Notification::send(
                    $userId,
                    Notification::TYPE_GENERAL,
                    $message,
                    $title,
                    $channel,
                    get_class($this),
                    $this->id
                );
                $notified++;
            } catch (\Exception $e) {
                Log::warning("Failed to notify specific commenter #{$userId}: " . $e->getMessage());
            }
        }

        return $notified;
    }

    /**
     * Get all users who have commented on this model
     * 
     * @return \Illuminate\Support\Collection
     */
    public function getCommenters(): \Illuminate\Support\Collection
    {
        if (!method_exists($this, 'comments')) {
            return collect();
        }

        return $this->comments()
            ->with('teacher')
            ->get()
            ->pluck('teacher')
            ->filter()
            ->unique('id')
            ->values();
    }

    /**
     * Get commenter IDs who have commented on this model
     * 
     * @return array
     */
    public function getCommenterIds(): array
    {
        if (!method_exists($this, 'comments')) {
            return [];
        }

        return $this->comments()
            ->distinct('teacher_id')
            ->pluck('teacher_id')
            ->toArray();
    }

    /**
     * Get commenters grouped by their last comment date
     * 
     * @param int $days Number of days to look back
     * @return \Illuminate\Support\Collection
     */
    public function getRecentCommenters(int $days = 30): \Illuminate\Support\Collection
    {
        if (!method_exists($this, 'comments')) {
            return collect();
        }

        $cutoffDate = now()->subDays($days);

        return $this->comments()
            ->where('created_at', '>=', $cutoffDate)
            ->with('teacher')
            ->get()
            ->groupBy('teacher_id')
            ->map(function ($comments) {
                return [
                    'user' => $comments->first()->teacher,
                    'comment_count' => $comments->count(),
                    'last_comment_at' => $comments->max('created_at'),
                ];
            })
            ->values();
    }

    /**
     * Check if a specific user has commented on this model
     * 
     * @param int $userId
     * @return bool
     */
    public function hasUserCommented(int $userId): bool
    {
        if (!method_exists($this, 'comments')) {
            return false;
        }

        return $this->comments()
            ->where('teacher_id', $userId)
            ->exists();
    }

    /**
     * Get the total number of unique commenters
     * 
     * @return int
     */
    public function getUniqueCommentersCount(): int
    {
        if (!method_exists($this, 'comments')) {
            return 0;
        }

        return $this->comments()
            ->distinct('teacher_id')
            ->count('teacher_id');
    }

    /**
     * Get comment statistics for this model
     * 
     * @return array
     */
    public function getCommentStatistics(): array
    {
        if (!method_exists($this, 'comments')) {
            return [
                'total_comments' => 0,
                'unique_commenters' => 0,
                'most_active_commenter' => null,
                'last_comment_at' => null,
            ];
        }

        $comments = $this->comments();
        
        // Get most active commenter
        $mostActive = $comments->select('teacher_id')
            ->selectRaw('COUNT(*) as comment_count')
            ->groupBy('teacher_id')
            ->orderByDesc('comment_count')
            ->with('teacher')
            ->first();

        return [
            'total_comments' => $comments->count(),
            'unique_commenters' => $comments->distinct('teacher_id')->count('teacher_id'),
            'most_active_commenter' => $mostActive ? [
                'user' => $mostActive->teacher,
                'comment_count' => $mostActive->comment_count,
            ] : null,
            'last_comment_at' => $comments->max('created_at'),
        ];
    }

    /**
     * Notify commenters about a specific event with different message templates
     * 
     * @param User $triggeredBy User who triggered the event
     * @param string $eventType Type of event (update, delete, pin, etc.)
     * @param array $additionalData Additional data for message customization
     * @return int Number of users notified
     */
    public function notifyCommentersOfEvent(
        User $triggeredBy,
        string $eventType,
        array $additionalData = []
    ): int {
        $messages = [
            'updated' => "{$triggeredBy->name} updated the document",
            'deleted' => "A document you commented on has been deleted",
            'pinned' => "{$triggeredBy->name} pinned an important comment",
            'resolved' => "A comment thread was marked as resolved",
            'reopened' => "A resolved comment thread was reopened",
        ];

        $titles = [
            'updated' => 'Document Updated',
            'deleted' => 'Document Deleted',
            'pinned' => 'Comment Pinned',
            'resolved' => 'Thread Resolved',
            'reopened' => 'Thread Reopened',
        ];

        $message = $messages[$eventType] ?? "New activity on document";
        $title = $titles[$eventType] ?? 'Document Activity';

        // Customize message with additional data if needed
        if (!empty($additionalData)) {
            foreach ($additionalData as $key => $value) {
                $message = str_replace("{{$key}}", $value, $message);
            }
        }

        return $this->notifyCommentersExcept($triggeredBy, $message, $title);
    }

    /**
     * Get unread comment notifications for a specific user on this model
     * 
     * @param int $userId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getUnreadCommentNotificationsForUser(int $userId)
    {
        return Notification::where('user_id', $userId)
            ->where('related_type', get_class($this))
            ->where('related_id', $this->id)
            ->where('type', Notification::TYPE_GENERAL)
            ->unread()
            ->get();
    }

    /**
     * Mark all comment notifications as read for a specific user on this model
     * 
     * @param int $userId
     * @return int Number of notifications marked as read
     */
    public function markAllCommentNotificationsAsRead(int $userId): int
    {
        return Notification::where('user_id', $userId)
            ->where('related_type', get_class($this))
            ->where('related_id', $this->id)
            ->where('type', Notification::TYPE_GENERAL)
            ->unread()
            ->update(['is_read' => true, 'read_at' => now()]);
    }
}