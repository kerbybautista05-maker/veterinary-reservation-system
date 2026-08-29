<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RankingSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('rankings')->insert([

            // April 2025 – Rank 1: Maria Santos (Elite Vanguard)
            [
                'teacher_id'          => 5,
                'reporting_period_id' => 2,
                'rank_position'       => 1,
                'composite_score'     => 96.00,
                'is_elite_vanguard'   => true,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],

            // April 2025 – Rank 2: Jose Torres
            [
                'teacher_id'          => 6,
                'reporting_period_id' => 2,
                'rank_position'       => 2,
                'composite_score'     => 80.50,
                'is_elite_vanguard'   => false,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],

            // April 2025 – Rank 3: Clarissa Villanueva
            [
                'teacher_id'          => 7,
                'reporting_period_id' => 2,
                'rank_position'       => 3,
                'composite_score'     => 58.00,
                'is_elite_vanguard'   => false,
                'created_at'          => $now,
                'updated_at'          => $now,
            ],
        ]);
    }
}
