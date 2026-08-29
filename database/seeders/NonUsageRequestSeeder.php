<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class NonUsageRequestSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('non_usage_requests')->insert([

            // Maria Santos – approved regular leave (used 1 free credit)
            [
                'teacher_id'           => 5,
                'reporting_period_id'  => 2,
                'request_type'         => 'regular',
                'start_date'           => '2025-04-14',
                'end_date'             => '2025-04-14',
                'replacement_date'     => '2025-04-19',
                'uses_free_credit'     => true,
                'free_credits_used'    => 1,
                'reason'               => 'Medical consultation for recurring back pain.',
                'proof_path'           => 'proofs/non_usage/maria_santos_medical_april.jpg',
                'status'               => 'approved',
                'admin_remarks'        => 'Approved. 1 free credit deducted.',
                'reviewed_by'          => 1,
                'reviewed_at'          => '2025-04-10 09:30:00',
                'created_at'           => $now,
                'updated_at'           => $now,
            ],

            // Jose Torres – pending regular request
            [
                'teacher_id'           => 6,
                'reporting_period_id'  => 3,
                'request_type'         => 'regular',
                'start_date'           => '2025-05-12',
                'end_date'             => '2025-05-12',
                'replacement_date'     => '2025-05-17',
                'uses_free_credit'     => false,
                'free_credits_used'    => 0,
                'reason'               => 'Family emergency requiring travel to province.',
                'proof_path'           => 'proofs/non_usage/jose_torres_family_may.jpg',
                'status'               => 'pending',
                'admin_remarks'        => null,
                'reviewed_by'          => null,
                'reviewed_at'          => null,
                'created_at'           => $now,
                'updated_at'           => $now,
            ],

            // Clarissa Villanueva – rejected long-term request
            [
                'teacher_id'           => 7,
                'reporting_period_id'  => 2,
                'request_type'         => 'long_term',
                'start_date'           => '2025-04-07',
                'end_date'             => '2025-04-25',
                'replacement_date'     => null,
                'uses_free_credit'     => false,
                'free_credits_used'    => 0,
                'reason'               => 'Extended leave for personal health recovery.',
                'proof_path'           => 'proofs/non_usage/clarissa_villanueva_health_april.pdf',
                'status'               => 'rejected',
                'admin_remarks'        => 'Duration too long without sufficient documentation. Please resubmit with complete medical certificate.',
                'reviewed_by'          => 1,
                'reviewed_at'          => '2025-04-05 14:00:00',
                'created_at'           => $now,
                'updated_at'           => $now,
            ],
        ]);
    }
}
