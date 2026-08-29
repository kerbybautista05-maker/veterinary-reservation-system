<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ActivityLogSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('activity_logs')->insert([

            // Admin approved Maria Santos' refund
            [
                'user_id'      => 1,
                'action'       => 'approved_refund',
                'subject_type' => 'App\\Models\\RefundRecord',
                'subject_id'   => 1,
                'old_values'   => json_encode(['status' => 'pending', 'is_paid' => false]),
                'new_values'   => json_encode(['status' => 'approved', 'is_paid' => true, 'paid_at' => '2025-04-05 09:00:00']),
                'ip_address'   => '192.168.1.1',
                'user_agent'   => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'created_at'   => '2025-04-02 11:00:00',
                'updated_at'   => '2025-04-02 11:00:00',
            ],

            // Admin rejected Clarissa Villanueva's non-usage request
            [
                'user_id'      => 1,
                'action'       => 'rejected_non_usage_request',
                'subject_type' => 'App\\Models\\NonUsageRequest',
                'subject_id'   => 3,
                'old_values'   => json_encode(['status' => 'pending']),
                'new_values'   => json_encode(['status' => 'rejected', 'admin_remarks' => 'Duration too long without sufficient documentation.']),
                'ip_address'   => '192.168.1.1',
                'user_agent'   => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'created_at'   => '2025-04-05 14:00:00',
                'updated_at'   => '2025-04-05 14:00:00',
            ],

            // Admin updated Clarissa Villanueva's contract end date
            [
                'user_id'      => 1,
                'action'       => 'updated_contract',
                'subject_type' => 'App\\Models\\Contract',
                'subject_id'   => 3,
                'old_values'   => json_encode(['end_date' => '2025-04-30']),
                'new_values'   => json_encode(['end_date' => '2025-05-31']),
                'ip_address'   => '192.168.1.1',
                'user_agent'   => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'created_at'   => '2025-04-01 10:00:00',
                'updated_at'   => '2025-04-01 10:00:00',
            ],
        ]);
    }
}
