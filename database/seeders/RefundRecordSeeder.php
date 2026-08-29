<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RefundRecordSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('refund_records')->insert([

            // Maria Santos – approved and paid
            [
                'teacher_id'          => 5,
                'submitted_by'        => 2,    // Angela Reyes (TL)
                'reporting_period_id' => 1,    // March 2025
                'amount'              => 800.00,
                'reason'              => 'System overbooking error caused loss of classes in March. Refund requested for 4 affected sessions.',
                'proof_path'          => 'proofs/refunds/maria_santos_march_overbooking.pdf',
                'status'              => 'approved',
                'reviewed_by'         => 1,
                'reviewed_at'         => '2025-04-02 11:00:00',
                'admin_remarks'       => 'Verified. System error confirmed. Refund approved.',
                'is_paid'             => true,
                'paid_at'             => '2025-04-05 09:00:00',
                'created_at'          => $now,
                'updated_at'          => $now,
            ],

            // Jose Torres – pending review
            [
                'teacher_id'          => 6,
                'submitted_by'        => 3,    // Ramon Dela Cruz (TL)
                'reporting_period_id' => 2,    // April 2025
                'amount'              => 500.00,
                'reason'              => 'Penalty incorrectly applied due to data entry error by admin. Request for penalty reversal.',
                'proof_path'          => 'proofs/refunds/jose_torres_penalty_dispute_april.jpg',
                'status'              => 'pending',
                'reviewed_by'         => null,
                'reviewed_at'         => null,
                'admin_remarks'       => null,
                'is_paid'             => false,
                'paid_at'             => null,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],

            // Clarissa Villanueva – rejected
            [
                'teacher_id'          => 7,
                'submitted_by'        => 4,    // Patricia Mendoza (TL)
                'reporting_period_id' => 1,    // March 2025
                'amount'              => 1250.00,
                'reason'              => 'Requesting full penalty refund for March due to personal hardship.',
                'proof_path'          => 'proofs/refunds/clarissa_villanueva_march_hardship.pdf',
                'status'              => 'rejected',
                'reviewed_by'         => 1,
                'reviewed_at'         => '2025-04-08 15:30:00',
                'admin_remarks'       => 'Refund request rejected. Penalties were validly incurred and documented. Personal hardship is not a qualifying ground for penalty reversal.',
                'is_paid'             => false,
                'paid_at'             => null,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],
        ]);
    }
}
