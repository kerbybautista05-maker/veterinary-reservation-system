<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FreeCreditLedgerSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('free_credit_ledger')->insert([

            // Maria Santos – granted 3 credits at year start, used 1
            [
                'teacher_id'             => 5,
                'transaction_type'       => 'grant',
                'credits'                => 3,
                'description'            => 'Annual free credit grant for 2025.',
                'non_usage_request_id'   => null,
                'created_at'             => '2025-01-01 08:00:00',
                'updated_at'             => '2025-01-01 08:00:00',
            ],
            [
                'teacher_id'             => 5,
                'transaction_type'       => 'deduct',
                'credits'                => 1,
                'description'            => 'Credit used for approved non-usage request (April 14, 2025).',
                'non_usage_request_id'   => 1,
                'created_at'             => '2025-04-10 09:30:00',
                'updated_at'             => '2025-04-10 09:30:00',
            ],

            // Jose Torres – granted 3 credits, none used
            [
                'teacher_id'             => 6,
                'transaction_type'       => 'grant',
                'credits'                => 3,
                'description'            => 'Annual free credit grant for 2025.',
                'non_usage_request_id'   => null,
                'created_at'             => '2025-01-01 08:00:00',
                'updated_at'             => '2025-01-01 08:00:00',
            ],

            // Clarissa Villanueva – granted 3 credits, none used (request was rejected)
            [
                'teacher_id'             => 7,
                'transaction_type'       => 'grant',
                'credits'                => 3,
                'description'            => 'Annual free credit grant for 2025.',
                'non_usage_request_id'   => null,
                'created_at'             => '2025-01-01 08:00:00',
                'updated_at'             => '2025-01-01 08:00:00',
            ],
        ]);
    }
}
