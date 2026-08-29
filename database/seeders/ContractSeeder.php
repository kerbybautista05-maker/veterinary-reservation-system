<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ContractSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('contracts')->insert([
            // Maria Santos – active contract, auto-extended
            [
                'teacher_id'        => 5,
                'start_date'        => '2024-01-01',
                'end_date'          => '2024-12-31',
                'is_auto_extended'  => true,
                'extended_end_date' => '2025-06-30',
                'notes'             => 'Extended upon mutual agreement. Performance rating: Excellent.',
                'created_at'        => $now,
                'updated_at'        => $now,
            ],
            // Jose Torres – active contract, not extended yet
            [
                'teacher_id'        => 6,
                'start_date'        => '2024-03-01',
                'end_date'          => '2025-02-28',
                'is_auto_extended'  => false,
                'extended_end_date' => null,
                'notes'             => 'Initial 12-month contract. Review scheduled Q1 2025.',
                'created_at'        => $now,
                'updated_at'        => $now,
            ],
            // Clarissa Villanueva – contract nearing expiry
            [
                'teacher_id'        => 7,
                'start_date'        => '2024-06-01',
                'end_date'          => '2025-05-31',
                'is_auto_extended'  => false,
                'extended_end_date' => null,
                'notes'             => 'Probationary contract. Renewal subject to performance evaluation.',
                'created_at'        => $now,
                'updated_at'        => $now,
            ],
        ]);
    }
}
