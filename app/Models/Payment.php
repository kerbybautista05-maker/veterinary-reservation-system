<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A payment transaction against an Appointment.
 *
 * @property int    $id
 * @property int    $appointment_id
 * @property int    $owner_id
 * @property float  $amount
 * @property string $payment_method
 * @property string $status
 */
class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'owner_id',
        'amount',
        'currency',
        'payment_method',
        'status',
        'transaction_reference',
        'receipt_path',
        'paid_at',
        'notes',
    ];

    protected $appends = [
        'receipt_url',
        'status_label',
        'status_color',
    ];

    protected function casts(): array
    {
        return [
            'amount'     => 'decimal:2',
            'paid_at'    => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    // ============================
    // Constants
    // ============================

    const METHOD_CASH          = 'cash';
    const METHOD_GCASH         = 'gcash';
    const METHOD_PAYMAYA       = 'paymaya';
    const METHOD_CREDIT_CARD   = 'credit_card';
    const METHOD_DEBIT_CARD    = 'debit_card';
    const METHOD_BANK_TRANSFER = 'bank_transfer';

    const STATUS_PENDING   = 'pending';
    const STATUS_PAID      = 'paid';
    const STATUS_FAILED    = 'failed';
    const STATUS_REFUNDED  = 'refunded';
    const STATUS_CANCELLED = 'cancelled';

    // ============================
    // Relationships
    // ============================

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    // ============================
    // Scopes
    // ============================

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopePaid($query)
    {
        return $query->where('status', self::STATUS_PAID);
    }

    public function scopeBetweenDates($query, $from, $to)
    {
        return $query->whereBetween('paid_at', [$from, $to]);
    }

    // ============================
    // Accessors
    // ============================

    public function getReceiptUrlAttribute(): ?string
    {
        return $this->receipt_path ? asset('storage/' . $this->receipt_path) : null;
    }

    public function getStatusLabelAttribute(): string
    {
        return ucfirst($this->status);
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PAID      => 'green',
            self::STATUS_PENDING   => 'yellow',
            self::STATUS_FAILED    => 'red',
            self::STATUS_REFUNDED  => 'blue',
            self::STATUS_CANCELLED => 'gray',
            default                => 'gray',
        };
    }

    // ============================
    // Helper Methods
    // ============================

    public function isPaid(): bool { return $this->status === self::STATUS_PAID; }
    public function isPending(): bool { return $this->status === self::STATUS_PENDING; }

    public function markAsPaid(?string $transactionReference = null): bool
    {
        return $this->update([
            'status'                 => self::STATUS_PAID,
            'transaction_reference'  => $transactionReference ?? $this->transaction_reference,
            'paid_at'                => now(),
        ]);
    }

    public function markAsFailed(): bool
    {
        return $this->update(['status' => self::STATUS_FAILED]);
    }

    public function refund(): bool
    {
        return $this->update(['status' => self::STATUS_REFUNDED]);
    }

    // ============================
    // Static Methods
    // ============================

    public static function getTotalRevenue($from = null, $to = null): float
    {
        $query = self::paid();
        if ($from && $to) {
            $query->betweenDates($from, $to);
        }
        return (float) $query->sum('amount');
    }
}
