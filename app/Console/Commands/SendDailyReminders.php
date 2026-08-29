<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\HealthReminder;
use App\Models\Notification;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Console\Command;

/**
 * Runs once a day (see routes/console.php for the schedule) and emails
 * pet owners about anything time-sensitive:
 *   1. Appointments happening tomorrow (advance notice)
 *   2. Health reminders due within the next few days (reuses the same
 *      logic HealthReminderController::sendDueReminders exposes manually)
 *   3. Payments left pending for more than 2 days (a gentle nudge)
 *
 * Every email goes through Notification::notify(..., CHANNEL_BOTH), so it
 * creates the in-app notification AND sends the branded email via
 * App\Support\ClinicMail in one call — nothing here talks to Mail directly.
 */
class SendDailyReminders extends Command
{
    protected $signature = 'reminders:send-daily';

    protected $description = 'Email pet owners about tomorrow\'s appointments, upcoming health reminders, and pending payments.';

    public function handle(): int
    {
        $this->sendAppointmentReminders();
        $this->sendHealthReminders();
        $this->sendPendingPaymentReminders();

        return self::SUCCESS;
    }

    // =========================================================================
    // Appointments happening tomorrow
    // =========================================================================

    private function sendAppointmentReminders(): void
    {
        $tomorrow = Carbon::tomorrow()->toDateString();

        $appointments = Appointment::with(['pet', 'owner', 'veterinarian'])
            ->whereDate('appointment_date', $tomorrow)
            ->whereIn('status', [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED])
            ->where('reminder_sent', false)
            ->get();

        $sent = 0;

        foreach ($appointments as $appointment) {
            if (!$appointment->owner || !$appointment->pet) {
                continue;
            }

            if (!$appointment->owner->email) {
                continue;
            }

            $time    = Carbon::parse($appointment->appointment_time)->format('g:i A');
            $vet     = $appointment->veterinarian
                ? ' with Dr. ' . ($appointment->veterinarian->full_name ?? $appointment->veterinarian->name)
                : '';
            $service = $appointment->service_type ? " ({$appointment->service_type})" : '';

            $subject = "Reminder: Upcoming Appointment Tomorrow for {$appointment->pet->name}";
            $body    = "Dear {$appointment->owner->first_name},\n\n"
                . "This is a friendly reminder that {$appointment->pet->name} has an appointment tomorrow"
                . "{$service} at {$time}{$vet}.\n\n"
                . "Clinic: NE Veterinary Clinic\n\n"
                . "Please arrive a few minutes early.\n\n"
                . "You can view your appointment details at: "
                . url("/owner/appointments/{$appointment->id}");

            \App\Support\ClinicMail::send(
                $appointment->owner,
                $subject,
                $subject,
                $body,
                'View Appointment',
                url("/owner/appointments/{$appointment->id}")
            );

            $appointment->update([
                'reminder_sent'   => true,
                'reminder_sent_at' => now(),
            ]);

            $sent++;
        }

        $this->info("Appointment reminders sent: {$sent}");
    }

    // =========================================================================
    // Health reminders due soon (vaccinations, deworming, checkups, etc.)
    // =========================================================================

    private function sendHealthReminders(): void
    {
        $due = HealthReminder::needingReminderEmail()->with(['pet', 'owner'])->get();

        foreach ($due as $reminder) {
            if (!$reminder->owner || !$reminder->pet) {
                continue;
            }

            Notification::notify(
                $reminder->owner,
                'Upcoming Health Reminder',
                "{$reminder->pet->name} has a {$reminder->type} reminder due on "
                    . $reminder->due_date->format('F j, Y') . ": {$reminder->title}",
                Notification::TYPE_HEALTH_REMINDER,
                Notification::CHANNEL_BOTH,
                "/owner/pets/{$reminder->pet_id}"
            );

            $reminder->markReminderSent();
        }

        $this->info("Health reminders sent: {$due->count()}");
    }

    // =========================================================================
    // Payments still pending after 2+ days — gentle nudge
    // =========================================================================

    private function sendPendingPaymentReminders(): void
    {
        $stale = Payment::with(['owner', 'appointment.pet'])
            ->where('status', Payment::STATUS_PENDING)
            ->where('created_at', '<=', Carbon::now()->subDays(2))
            ->get();

        foreach ($stale as $payment) {
            if (!$payment->owner) {
                continue;
            }

            $petName = $payment->appointment?->pet?->name ?? 'your pet';

            Notification::notify(
                $payment->owner,
                'Payment Still Pending',
                "Your payment of {$payment->currency} " . number_format((float) $payment->amount, 2)
                    . " for {$petName}'s visit is still pending confirmation. "
                    . 'Contact the clinic if you believe this is a mistake.',
                Notification::TYPE_PAYMENT_UPDATE,
                Notification::CHANNEL_BOTH,
                "/owner/payments/{$payment->id}"
            );
        }

        $this->info("Pending payment reminders sent: {$stale->count()}");
    }
}
