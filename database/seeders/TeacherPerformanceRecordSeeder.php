<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TeacherPerformanceRecordSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('teacher_performance_records')->insert([

            // ── Maria Santos | April 2025 | Davao Main ──────────────────────
            // High performer, no issues
            [
                'teacher_id'          => 5,
                'reporting_period_id' => 2,
                'encoded_by'          => 2,     // Angela Reyes (TL)
                'branch_id'           => 1,
                'duty_status'         => 'duty',
                'opened_slots'        => 80,
                'booked_slots'        => 76,
                'finished_classes'    => 74,
                'off_days'            => 2,
                'penalty_count'       => 0,
                'penalty_amount'      => 0.00,
                'penalty_paid'        => false,
                'penalty_paid_at'     => null,
                'booking_rate'        => 95.00,  // 76/80
                'attendance_rate'     => 97.37,  // 74/76
                'performance_score'   => 96.00,
                'flag_low_slots'      => false,
                'flag_high_penalties' => false,
                'flag_excess_off_days'=> false,
                'needs_attention'     => false,
                'remarks'             => 'Excellent performance this period. Elite Vanguard candidate.',
                'created_at'          => $now,
                'updated_at'          => $now,
            ],

            // ── Jose Torres | April 2025 | Cebu ─────────────────────────────
            // Moderate performer, some penalties
            [
                'teacher_id'          => 6,
                'reporting_period_id' => 2,
                'encoded_by'          => 3,     // Ramon Dela Cruz (TL)
                'branch_id'           => 2,
                'duty_status'         => 'duty',
                'opened_slots'        => 60,
                'booked_slots'        => 45,
                'finished_classes'    => 42,
                'off_days'            => 4,
                'penalty_count'       => 2,
                'penalty_amount'      => 500.00,
                'penalty_paid'        => true,
                'penalty_paid_at'     => '2025-05-03 10:00:00',
                'booking_rate'        => 75.00,  // 45/60
                'attendance_rate'     => 93.33,  // 42/45
                'performance_score'   => 80.50,
                'flag_low_slots'      => false,
                'flag_high_penalties' => false,
                'flag_excess_off_days'=> false,
                'needs_attention'     => false,
                'remarks'             => 'Penalties settled. Advised to improve booking rate.',
                'created_at'          => $now,
                'updated_at'          => $now,
            ],

            // ── Clarissa Villanueva | April 2025 | Manila ────────────────────
            // Needs attention — low slots, high penalties, excess off days
            [
                'teacher_id'          => 7,
                'reporting_period_id' => 2,
                'encoded_by'          => 4,     // Patricia Mendoza (TL)
                'branch_id'           => 3,
                'duty_status'         => 'on_leave',
                'opened_slots'        => 20,
                'booked_slots'        => 10,
                'finished_classes'    => 8,
                'off_days'            => 10,
                'penalty_count'       => 5,
                'penalty_amount'      => 1250.00,
                'penalty_paid'        => false,
                'penalty_paid_at'     => null,
                'booking_rate'        => 50.00,  // 10/20
                'attendance_rate'     => 80.00,  // 8/10
                'performance_score'   => 58.00,
                'flag_low_slots'      => true,
                'flag_high_penalties' => true,
                'flag_excess_off_days'=> true,
                'needs_attention'     => true,
                'remarks'             => 'Teacher was partially on leave. Admin follow-up required for unpaid penalties.',
                'created_at'          => $now,
                'updated_at'          => $now,
            ],
        ]);
    }
}
