<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TeamLeaderBranchSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('team_leader_branches')->insert([
            // Angela Reyes (ID 2) → Davao Main
            [
                'team_leader_id' => 2,
                'branch_id'      => 1,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
            // Ramon Dela Cruz (ID 3) → Cebu
            [
                'team_leader_id' => 3,
                'branch_id'      => 2,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
            // Patricia Mendoza (ID 4) → Manila
            [
                'team_leader_id' => 4,
                'branch_id'      => 3,
                'created_at'     => $now,
                'updated_at'     => $now,
            ],
        ]);
    }
}
