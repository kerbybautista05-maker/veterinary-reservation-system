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
            UserSeeder::class,                     // 1.  Users (all roles)
            BranchSeeder::class,                   // 2.  Branches
            TeamLeaderBranchSeeder::class,         // 3.  TL ↔ Branch pivot
            TeacherProfileSeeder::class,           // 4.  Teacher profiles
            ContractSeeder::class,                 // 5.  Contracts
            ReportingPeriodSeeder::class,          // 6.  Reporting periods
            TeacherPerformanceRecordSeeder::class, // 7.  Performance records
            AttendanceSelfieSeeder::class,         // 8.  Attendance selfies
            TimeTrackerSettingSeeder::class,       // 9.  Staff tracker settings (admin-controlled)
            TimeTrackerSeeder::class,              // 10. Staff time tracker (empty — live only)
            NonUsageRequestSeeder::class,          // 11. Non-usage requests
            FreeCreditLedgerSeeder::class,         // 12. Free credit ledger
            RefundRecordSeeder::class,             // 13. Refund records
            RankingSeeder::class,                  // 14. Rankings
            AnnouncementSeeder::class,             // 15. Announcements
            ChallengeSeeder::class,                // 16. Challenges
            NotificationSeeder::class,             // 17. Notifications
            ActivityLogSeeder::class,              // 18. Activity logs
            LoginLogSeeder::class,                 // 19. Login logs
        ]);
    }
}
