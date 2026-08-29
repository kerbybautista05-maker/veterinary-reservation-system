<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Feedback;
use App\Models\Payment;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    /**
     * GET /api/admin/reports
     *
     * Query params:
     *   from      – start date (YYYY-MM-DD), default: beginning of current month
     *   to        – end date (YYYY-MM-DD), default: today
     *   period    – group-by granularity: daily | weekly | monthly | yearly (default: daily)
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $from   = $request->input('from', now()->startOfMonth()->toDateString());
            $to     = $request->input('to', now()->toDateString());
            $period = $request->input('period', 'daily');

            // Base query scoped to date range (using appointment_date for appointments)
            $apptQuery = Appointment::whereDate('appointment_date', '>=', $from)
                                    ->whereDate('appointment_date', '<=', $to);

            // All appointments in range
            $totalAppointments = (clone $apptQuery)->count();

            // ── 1. OVERVIEW ────────────────────────────────────────────────────
            $statusCounts = (clone $apptQuery)
                ->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            $noShowCount      = $statusCounts['no_show'] ?? 0;
            $cancelledCount   = $statusCounts['cancelled'] ?? 0;
            $pendingCount     = $statusCounts['pending'] ?? 0;
            $confirmedCount   = $statusCounts['confirmed'] ?? 0;
            $completedCount   = $statusCounts['completed'] ?? 0;
            $inProgressCount  = $statusCounts['in_progress'] ?? 0;
            $rescheduledCount = $statusCounts['rescheduled'] ?? 0;

            $noShowRate      = $totalAppointments > 0 ? round(($noShowCount / $totalAppointments) * 100, 1) : 0;
            $cancellationRate = $totalAppointments > 0 ? round(($cancelledCount / $totalAppointments) * 100, 1) : 0;

            // Cancellation reasons
            $cancellationReasons = Appointment::whereDate('appointment_date', '>=', $from)
                ->whereDate('appointment_date', '<=', $to)
                ->where('status', 'cancelled')
                ->whereNotNull('cancellation_reason')
                ->where('cancellation_reason', '!=', '')
                ->selectRaw('cancellation_reason, count(*) as count')
                ->groupBy('cancellation_reason')
                ->orderByDesc('count')
                ->limit(5)
                ->get()
                ->toArray();

            // Appointments by status (for chart)
            $appointmentsByStatus = [
                ['status' => 'Pending',     'count' => $pendingCount,     'color' => '#EAB308'],
                ['status' => 'Confirmed',   'count' => $confirmedCount,   'color' => '#3B82F6'],
                ['status' => 'In Progress', 'count' => $inProgressCount,  'color' => '#6366F1'],
                ['status' => 'Completed',   'count' => $completedCount,   'color' => '#22C55E'],
                ['status' => 'Cancelled',   'count' => $cancelledCount,   'color' => '#EF4444'],
                ['status' => 'No-show',     'count' => $noShowCount,      'color' => '#6B7280'],
                ['status' => 'Rescheduled', 'count' => $rescheduledCount, 'color' => '#F97316'],
            ];

            // Peak hours (8AM–5PM)
            $peakHours = (clone $apptQuery)
                ->selectRaw("CAST(SUBSTRING(appointment_time, 1, 2) AS UNSIGNED) as hour, count(*) as count")
                ->whereRaw("CAST(SUBSTRING(appointment_time, 1, 2) AS UNSIGNED) BETWEEN 8 AND 17")
                ->groupBy('hour')
                ->orderBy('hour')
                ->get()
                ->map(fn ($r) => ['hour' => sprintf('%02d:00', $r->hour), 'count' => $r->count])
                ->toArray();

            // Peak days of week
            $peakDays = (clone $apptQuery)
                ->selectRaw("DAYNAME(appointment_date) as day_name, DAYOFWEEK(appointment_date) as day_num, count(*) as count")
                ->groupBy('day_name', 'day_num')
                ->orderBy('day_num')
                ->get()
                ->map(fn ($r) => ['day' => $r->day_name, 'count' => $r->count])
                ->toArray();

            // Average appointments per day
            $dateSpan = max(1, \Carbon\Carbon::parse($from)->diffInDays(\Carbon\Carbon::parse($to)) + 1);
            $avgAppointmentsPerDay = round($totalAppointments / $dateSpan, 1);

            // Appointments trend (over time)
            $appointmentsTrend = $this->getTrendData($from, $to, $period, 'appointment_date');

            // ── 2. CLIENT & PET ANALYTICS ──────────────────────────────────────
            $totalPetOwners = User::petOwners()->active()->count();
            $totalPets      = Pet::where('is_active', true)->count();

            // New clients per month (pet owners registered)
            $newClientsPerMonth = User::petOwners()
                ->whereDate('created_at', '>=', $from)
                ->whereDate('created_at', '<=', $to)
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, count(*) as count")
                ->groupBy('month')
                ->orderBy('month')
                ->get()
                ->map(fn ($r) => ['month' => $r->month, 'count' => $r->count])
                ->toArray();

            // Most common pet species
            $petSpecies = Pet::where('is_active', true)
                ->selectRaw('species, count(*) as count')
                ->groupBy('species')
                ->orderByDesc('count')
                ->limit(10)
                ->get()
                ->map(fn ($r) => ['name' => ucfirst($r->species), 'value' => $r->count])
                ->toArray();

            // Most common breeds
            $petBreeds = Pet::where('is_active', true)
                ->whereNotNull('breed')
                ->where('breed', '!=', '')
                ->selectRaw('breed, count(*) as count')
                ->groupBy('breed')
                ->orderByDesc('count')
                ->limit(10)
                ->get()
                ->map(fn ($r) => ['name' => $r->breed, 'value' => $r->count])
                ->toArray();

            // ── 3. OPERATIONAL METRICS ─────────────────────────────────────────
            // Average booking-to-appointment time (hours between created_at and appointment_date+appointment_time)
            $avgBookingLeadTime = (clone $apptQuery)
                ->whereNotNull('created_at')
                ->selectRaw("AVG(TIMESTAMPDIFF(HOUR, created_at, CONCAT(appointment_date, ' ', appointment_time))) as avg_hours")
                ->value('avg_hours');
            $avgBookingLeadTime = $avgBookingLeadTime ? round($avgBookingLeadTime, 1) : 0;

            // Slot utilization: booked slots / total available (8AM–5PM = 10 hours = 20 half-hour slots per day)
            $slotsPerDay = 20; // 8:00–17:00 in 30-min increments
            $totalAvailableSlots = $slotsPerDay * $dateSpan;
            $slotUtilization = $totalAvailableSlots > 0
                ? round(($totalAppointments / $totalAvailableSlots) * 100, 1)
                : 0;

            // ── 4. SERVICE TYPE ANALYTICS ──────────────────────────────────────
            $serviceTypes = (clone $apptQuery)
                ->whereNotNull('service_type')
                ->where('service_type', '!=', '')
                ->selectRaw('service_type, count(*) as count')
                ->groupBy('service_type')
                ->orderByDesc('count')
                ->get()
                ->map(fn ($r) => ['name' => $r->service_type, 'count' => $r->count])
                ->toArray();

            // Revenue per service type (only paid appointments)
            $revenueByService = Appointment::whereDate('appointment_date', '>=', $from)
                ->whereDate('appointment_date', '<=', $to)
                ->whereNotNull('service_type')
                ->where('service_type', '!=', '')
                ->whereHas('payment', fn ($q) => $q->where('status', 'paid'))
                ->selectRaw('service_type, SUM(payments.amount) as total_revenue, COUNT(*) as count')
                ->join('payments', 'payments.appointment_id', '=', 'appointments.id')
                ->where('payments.status', 'paid')
                ->groupBy('service_type')
                ->orderByDesc('total_revenue')
                ->get()
                ->map(fn ($r) => ['name' => $r->service_type, 'revenue' => (float) $r->total_revenue, 'count' => $r->count])
                ->toArray();

            // ── 5. REVENUE / FINANCIAL ─────────────────────────────────────────
            $totalRevenue = Payment::getTotalRevenue($from, $to);

            // Revenue over time
            $revenueOverTime = Payment::paid()
                ->whereDate('paid_at', '>=', $from)
                ->whereDate('paid_at', '<=', $to)
                ->selectRaw("DATE(paid_at) as date, SUM(amount) as revenue, COUNT(*) as count")
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(fn ($r) => ['date' => $r->date, 'revenue' => (float) $r->revenue, 'count' => $r->count])
                ->toArray();

            // Revenue by payment method
            $revenueByMethod = Payment::paid()
                ->whereDate('paid_at', '>=', $from)
                ->whereDate('paid_at', '<=', $to)
                ->selectRaw('payment_method, SUM(amount) as total, COUNT(*) as count')
                ->groupBy('payment_method')
                ->orderByDesc('total')
                ->get()
                ->toArray();

            // ── 6. EXISTING CARDS (keep) ───────────────────────────────────────
            $totalStaff = User::veterinarians()->active()->count();
            $avgRating  = Feedback::where('is_published', true)->avg('rating');
            $avgRating  = $avgRating ? round($avgRating, 1) : 0;
            $feedbackCount = Feedback::count();

            // ── RESPONSE ───────────────────────────────────────────────────────
            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => [
                        'total_appointments'    => $totalAppointments,
                        'total_revenue'         => $totalRevenue,
                        'avg_rating'            => $avgRating,
                        'feedback_count'        => $feedbackCount,
                        'no_show_rate'          => $noShowRate,
                        'cancellation_rate'     => $cancellationRate,
                        'no_show_count'         => $noShowCount,
                        'cancelled_count'       => $cancelledCount,
                        'cancellation_reasons'  => $cancellationReasons,
                        'appointments_by_status'=> $appointmentsByStatus,
                        'peak_hours'            => $peakHours,
                        'peak_days'             => $peakDays,
                        'avg_appointments_per_day' => $avgAppointmentsPerDay,
                        'appointments_trend'    => $appointmentsTrend,
                    ],
                    'clientPetAnalytics' => [
                        'total_pet_owners'      => $totalPetOwners,
                        'total_pets'            => $totalPets,
                        'total_staff'           => $totalStaff,
                        'new_clients_per_month' => $newClientsPerMonth,
                        'pet_species'           => $petSpecies,
                        'pet_breeds'            => $petBreeds,
                    ],
                    'operational' => [
                        'avg_booking_lead_time_hours' => $avgBookingLeadTime,
                        'slot_utilization_rate'       => $slotUtilization,
                        'total_available_slots'       => $totalAvailableSlots,
                        'date_span_days'              => $dateSpan,
                    ],
                    'serviceType' => [
                        'services'           => $serviceTypes,
                        'revenue_by_service' => $revenueByService,
                    ],
                    'revenue' => [
                        'total'             => $totalRevenue,
                        'over_time'         => $revenueOverTime,
                        'by_payment_method' => $revenueByMethod,
                    ],
                ],
                'meta' => [
                    'from'   => $from,
                    'to'     => $to,
                    'period' => $period,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error generating reports: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to generate reports', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Build trend data grouped by the chosen period.
     */
    private function getTrendData(string $from, string $to, string $period, string $dateColumn): array
    {
        $query = Appointment::whereDate($dateColumn, '>=', $from)
                            ->whereDate($dateColumn, '<=', $to);

        switch ($period) {
            case 'yearly':
                $results = $query
                    ->selectRaw("YEAR({$dateColumn}) as label, count(*) as count")
                    ->groupBy('label')
                    ->orderBy('label')
                    ->get();
                break;

            case 'monthly':
                $results = $query
                    ->selectRaw("DATE_FORMAT({$dateColumn}, '%Y-%m') as label, count(*) as count")
                    ->groupBy('label')
                    ->orderBy('label')
                    ->get();
                break;

            case 'weekly':
                $results = $query
                    ->selectRaw("YEARWEEK({$dateColumn}, 1) as label, MIN({$dateColumn}) as week_start, count(*) as count")
                    ->groupBy('label', 'week_start')
                    ->orderBy('label')
                    ->get()
                    ->map(fn ($r) => (object) ['label' => $r->week_start, 'count' => $r->count]);
                break;

            default: // daily
                $results = $query
                    ->selectRaw("DATE({$dateColumn}) as label, count(*) as count")
                    ->groupBy('label')
                    ->orderBy('label')
                    ->get();
                break;
        }

        return $results->map(fn ($r) => ['date' => $r->label, 'count' => $r->count])->toArray();
    }
}
