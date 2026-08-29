<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LoginLogSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('login_logs')->insert([

            // Admin – successful login
            [
                'user_id'      => 1,
                'email'        => 'admin@mn2coworking.com',
                'status'       => 'success',
                'ip_address'   => '192.168.1.1',
                'user_agent'   => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'logged_in_at' => '2025-05-06 08:00:00',
                'created_at'   => $now,
                'updated_at'   => $now,
            ],

            // Angela Reyes (Team Leader) – successful login
            [
                'user_id'      => 2,
                'email'        => 'angela.reyes@mn2coworking.com',
                'status'       => 'success',
                'ip_address'   => '192.168.1.45',
                'user_agent'   => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                'logged_in_at' => '2025-05-06 08:15:00',
                'created_at'   => $now,
                'updated_at'   => $now,
            ],

            // Unknown – failed login attempt (wrong password)
            [
                'user_id'      => null,
                'email'        => 'unknown@hacker.com',
                'status'       => 'failed',
                'ip_address'   => '45.33.32.156',
                'user_agent'   => 'python-requests/2.28.0',
                'logged_in_at' => '2025-05-06 03:44:00',
                'created_at'   => $now,
                'updated_at'   => $now,
            ],
        ]);
    }
}
