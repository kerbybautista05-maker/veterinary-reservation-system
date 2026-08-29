<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Clinic-wide announcements created by Admin, visible to Pet Owners and Veterinarians.
 *
 * @property int         $id
 * @property int         $created_by
 * @property int|null    $updated_by
 * @property string      $title
 * @property string      $body
 * @property string|null $image_path
 * @property bool        $is_published
 * @property \Carbon\Carbon|null $published_at
 * @property \Carbon\Carbon|null $start_date
 * @property \Carbon\Carbon|null $end_date
 */
class Announcement extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'created_by',
        'updated_by',
        'title',
        'body',
        'image_path',
        'is_published',
        'published_at',
        'start_date',
        'end_date',
    ];

    protected $appends = [
        'image_url',
        'status_label',
        'status_color',
        'excerpt',
        'formatted_published_at',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'published_at' => 'datetime',
            'start_date'   => 'date',
            'end_date'     => 'date',
            'created_at'   => 'datetime',
            'updated_at'   => 'datetime',
            'deleted_at'   => 'datetime',
        ];
    }

    // ============================
    // Relationships
    // ============================

    public function author()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function editor()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // ============================
    // Scopes
    // ============================

    /**
     * Active announcements: within date range (pure date-based visibility).
     * Visible when start_date <= today AND end_date >= today.
     */
    public function scopeActive($query)
    {
        $today = now()->toDateString();
        return $query->where(function ($q) use ($today) {
                         $q->whereNull('start_date')
                           ->orWhere('start_date', '<=', $today);
                     })
                     ->where(function ($q) use ($today) {
                         $q->whereNull('end_date')
                           ->orWhere('end_date', '>=', $today);
                     });
    }

    /**
     * @deprecated Use active() instead. Kept for backward compatibility.
     */
    public function scopePublished($query)
    {
        return $this->scopeActive($query);
    }

    public function scopeDraft($query)
    {
        return $query->where('is_published', false);
    }

    public function scopeRecent($query, int $limit = 10)
    {
        return $query->active()
                     ->orderByDesc('created_at')
                     ->limit($limit);
    }

    public function scopeUpcoming($query)
    {
        $today = now()->toDateString();
        return $query->where('start_date', '>', $today);
    }

    // ============================
    // Accessors / Mutators
    // ============================

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? asset('storage/' . $this->image_path) : null;
    }

    public function getStatusLabelAttribute(): string
    {
        if ($this->trashed()) return 'Deleted';
        $today = now()->toDateString();
        if ($this->start_date && $this->start_date > $today) return 'Scheduled';
        if ($this->end_date && $this->end_date < $today) return 'Expired';
        return 'Active';
    }

    public function getStatusColorAttribute(): string
    {
        if ($this->trashed()) return 'gray';
        $today = now()->toDateString();
        if ($this->start_date && $this->start_date > $today) return 'blue';
        if ($this->end_date && $this->end_date < $today) return 'gray';
        return 'green';
    }

    /**
     * Get excerpt from body content
     * NOTE: Do NOT add a parameter here - it will be called by Laravel without any arguments
     */
    public function getExcerptAttribute(): string
    {
        $length = 120;
        $text = strip_tags($this->body);
        return mb_strlen($text) > $length
            ? mb_substr($text, 0, $length) . '…'
            : $text;
    }

    public function getFormattedPublishedAtAttribute(): ?string
    {
        return $this->published_at?->format('F d, Y h:i A');
    }

    // ============================
    // Helper Methods
    // ============================

    public function isPublished(): bool
    {
        return $this->isActive();
    }

    public function isDraft(): bool
    {
        return false;
    }

    public function hasImage(): bool
    {
        return !empty($this->image_path);
    }

    public function isScheduled(): bool
    {
        $today = now()->toDateString();
        return $this->start_date && $this->start_date > $today;
    }

    public function isLive(): bool
    {
        return $this->isActive();
    }

    public function isActive(): bool
    {
        $today = now()->toDateString();
        $afterStart = !$this->start_date || $this->start_date <= $today;
        $beforeEnd = !$this->end_date || $this->end_date >= $today;
        return $afterStart && $beforeEnd;
    }

    public function isExpired(): bool
    {
        $today = now()->toDateString();
        return $this->end_date && $this->end_date < $today;
    }

    public function publish(): bool
    {
        return $this->update(['is_published' => true]);
    }

    public function unpublish(): bool
    {
        return $this->update(['is_published' => false]);
    }

    public function schedule(string $dateTime): bool
    {
        return $this->update([
            'is_published' => true,
            'start_date'   => $dateTime,
        ]);
    }

    public function getImageUrl(): ?string
    {
        return $this->getImageUrlAttribute();
    }

    public function getFormattedPublishedAt(): ?string
    {
        return $this->getFormattedPublishedAtAttribute();
    }

    public function getExcerpt(int $length = 120): string
    {
        $text = strip_tags($this->body);
        return mb_strlen($text) > $length
            ? mb_substr($text, 0, $length) . '…'
            : $text;
    }

    public function getStatusLabel(): string
    {
        return $this->getStatusLabelAttribute();
    }

    public function getStatusColor(): string
    {
        return $this->getStatusColorAttribute();
    }

    // ============================
    // Static Methods
    // ============================

    public static function getLatest(int $limit = 5): \Illuminate\Support\Collection
    {
        return self::active()
            ->with('author')
            ->orderByDesc('published_at')
            ->limit($limit)
            ->get();
    }
}
