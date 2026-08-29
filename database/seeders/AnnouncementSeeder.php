<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('announcements')->insert([
            [
                'created_by'   => 1,
                'title'        => 'May 2025 Performance Goals',
                'body'         => 'Dear Teachers, as we enter May 2025, we encourage everyone to aim for a minimum 85% booking rate and 95% attendance rate. Top performers will be featured in the Elite Vanguard board. Let us continue to deliver quality education and maintain our service standards. Thank you!',
                'image_path'   => null,
                'is_published' => true,
                'published_at' => '2025-05-01 08:00:00',
                'created_at'   => $now,
                'updated_at'   => $now,
                'deleted_at'   => null,
            ],
            [
                'created_by'   => 1,
                'title'        => 'System Maintenance – May 10, 2025',
                'body'         => 'Please be advised that the MN2 Co-Working Hub system will undergo scheduled maintenance on May 10, 2025 from 12:00 AM to 4:00 AM. During this time, the portal will be temporarily unavailable. Kindly plan your submissions and uploads accordingly. We apologize for any inconvenience.',
                'image_path'   => null,
                'is_published' => true,
                'published_at' => '2025-05-06 07:00:00',
                'created_at'   => $now,
                'updated_at'   => $now,
                'deleted_at'   => null,
            ],
            [
                'created_by'   => 1,
                'title'        => 'New NBI Clearance Submission Deadline',
                'body'         => 'All teachers whose NBI clearance expires before July 2025 are required to upload their renewed clearance no later than June 15, 2025. Failure to comply may affect your contract renewal and active status. Please coordinate with your Team Leader if you need assistance with the upload process.',
                'image_path'   => null,
                'is_published' => true,
                'published_at' => '2025-04-28 09:00:00',
                'created_at'   => $now,
                'updated_at'   => $now,
                'deleted_at'   => null,
            ],
        ]);
    }
}
