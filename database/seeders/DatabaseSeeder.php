<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     *
     * php artisan migrate:fresh --seed
     *
     *
     * Seed the application's database.
     *
     * Execution order respects foreign-key dependencies:
     *   users → branches → team_leader_branches
     *        → teacher_profiles → contracts
     *        → reporting_periods → teacher_performance_records
     *        → attendance_selfies
     *        → time_tracker_settings → time_tracker (empty — live tracker)
     *        → non_usage_requests → free_credit_ledger
     *        → refund_records → rankings
     *        → announcements → challenges
     *        → notifications → activity_logs → login_logs
     *
     * Credentials (all bcrypt-hashed):
     *   Admin        → admin@mn2coworking.com          / Admin@1234
     *   Team Leaders → *@mn2coworking.com              / Leader@1234
     *   Teachers     → *@mn2coworking.com              / Teacher@1234
     *   Staff        → *@mn2coworking.com              / Staff@1234
     */
    public function run(): void
{
    $this->call([
        VeterinaryAdminSeeder::class,
    ]);
}
}