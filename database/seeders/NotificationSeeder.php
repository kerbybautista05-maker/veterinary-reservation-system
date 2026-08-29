<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('notifications')->insert([

            // Maria Santos – approval notification (non-usage request approved)
            [
                'user_id'          => 5,
                'title'            => 'Leave Request Approved',
                'message'          => 'Your non-usage request for April 14, 2025 has been approved. One (1) free credit has been deducted from your balance. Replacement date is set to April 19, 2025.',
                'type'             => 'approval_notification',
                'notifiable_type'  => 'App\\Models\\NonUsageRequest',
                'notifiable_id'    => 1,
                'channel'          => 'both',
                'is_read'          => true,
                'read_at'          => '2025-04-10 10:00:00',
                'created_at'       => $now,
                'updated_at'       => $now,
            ],

            // Jose Torres – warning notification (booking rate low)
            [
                'user_id'          => 6,
                'title'            => 'Performance Warning: Low Booking Rate',
                'message'          => 'Your booking rate for April 2025 is at 75%, which is below the 85% target. Please work with your Team Leader to improve slot utilization in May 2025.',
                'type'             => 'warning_notification',
                'notifiable_type'  => 'App\\Models\\TeacherPerformanceRecord',
                'notifiable_id'    => 2,
                'channel'          => 'both',
                'is_read'          => false,
                'read_at'          => null,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],

            // Clarissa Villanueva – contract alert (expiring soon)
            [
                'user_id'          => 7,
                'title'            => 'Contract Expiry Reminder',
                'message'          => 'Your current contract is set to expire on May 31, 2025. Please coordinate with your Team Leader and the admin regarding renewal or extension. Failure to renew before expiry may result in deactivation.',
                'type'             => 'contract_alert',
                'notifiable_type'  => 'App\\Models\\Contract',
                'notifiable_id'    => 3,
                'channel'          => 'both',
                'is_read'          => false,
                'read_at'          => null,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
        ]);
    }
}
