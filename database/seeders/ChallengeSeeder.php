<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ChallengeSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('challenges')->insert([
            [
                'created_by'  => 1,
                'title'       => '100% Booking Rate Challenge',
                'description' => 'Achieve a 100% booking rate for any single week in May 2025. Teachers who accomplish this will earn a special badge and bonus free credit. Challenge runs the entire month of May. Progress is tracked weekly by your Team Leader.',
                'start_date'  => '2025-05-01',
                'end_date'    => '2025-05-31',
                'is_active'   => true,
                'created_at'  => $now,
                'updated_at'  => $now,
                'deleted_at'  => null,
            ],
            [
                'created_by'  => 1,
                'title'       => 'Zero Penalty April Recap',
                'description' => 'Recognition challenge for teachers who completed April 2025 with zero penalties. Qualifiers will be highlighted on the leaderboard and receive a performance commendation letter.',
                'start_date'  => '2025-04-01',
                'end_date'    => '2025-04-30',
                'is_active'   => false,
                'created_at'  => $now,
                'updated_at'  => $now,
                'deleted_at'  => null,
            ],
            [
                'created_by'  => 1,
                'title'       => 'Attendance Selfie Streak – 30 Days',
                'description' => 'Upload your attendance selfie every working day for 30 consecutive days starting May 1, 2025. Completing the streak earns you a Streak Champion badge and priority consideration for Elite Vanguard status this quarter.',
                'start_date'  => '2025-05-01',
                'end_date'    => '2025-05-31',
                'is_active'   => true,
                'created_at'  => $now,
                'updated_at'  => $now,
                'deleted_at'  => null,
            ],
        ]);
    }
}
