<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportingPeriodSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('reporting_periods')->insert([
            // March 2025 – locked (closed)
            [
                'id'           => 1,
                'month'        => 3,
                'year'         => 2025,
                'period_start' => '2025-03-01',
                'period_end'   => '2025-03-31',
                'is_locked'    => true,
                'created_at'   => $now,
                'updated_at'   => $now,
            ],
            // April 2025 – locked (closed)
            [
                'id'           => 2,
                'month'        => 4,
                'year'         => 2025,
                'period_start' => '2025-04-01',
                'period_end'   => '2025-04-30',
                'is_locked'    => true,
                'created_at'   => $now,
                'updated_at'   => $now,
            ],
            // May 2025 – current, open
            [
                'id'           => 3,
                'month'        => 5,
                'year'         => 2025,
                'period_start' => '2025-05-01',
                'period_end'   => '2025-05-31',
                'is_locked'    => false,
                'created_at'   => $now,
                'updated_at'   => $now,
            ],
        ]);
    }
}
