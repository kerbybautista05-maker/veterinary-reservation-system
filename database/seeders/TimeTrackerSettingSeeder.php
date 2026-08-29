<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TimeTrackerSettingSeeder extends Seeder
{
    /**
     * Each staff member gets one settings row. The admin may:
     *   - toggle tracker_enabled   → opens/closes the live clock-in portal
     *   - set required_hours       → daily target (default 7.00 for split shift)
     *   - set late_threshold_minutes → minutes past shift_start before marked "late"
     *   - set shift_start / shift_end → expected work window (1:00 PM to 9:00 PM)
     *   - set break_start / break_end → vacant period (5:00 PM to 6:00 PM)
     * 
     * Split Shift Schedule:
     *   First Shift:   1:00 PM - 5:00 PM  (4 hours)
     *   Break/Vacant:  5:00 PM - 6:00 PM  (1 hour)
     *   Second Shift:  6:00 PM - 9:00 PM  (3 hours)
     *   Total: 7 hours
     */
    public function run(): void
    {
        $now = Carbon::now();

        // Get all staff users (assuming staff IDs are 8, 9, etc.)
        // You can adjust this based on your actual staff IDs
        $staffUsers = DB::table('users')->where('role', 'staff')->get();

        if ($staffUsers->isEmpty()) {
            // Default staff entries if no staff users exist yet
            $this->insertDefaultSettings($now);
        } else {
            foreach ($staffUsers as $staff) {
                $this->insertSettingsForStaff($staff->id, $now);
            }
        }
    }

    /**
     * Insert settings for a specific staff member
     */
    private function insertSettingsForStaff(int $staffId, Carbon $now): void
    {
        // Check if settings already exist for this staff
        $exists = DB::table('time_tracker_settings')
            ->where('staff_id', $staffId)
            ->exists();

        if (!$exists) {
            DB::table('time_tracker_settings')->insert([
                'staff_id'               => $staffId,
                'tracker_enabled'        => false,     // Admin must enable manually
                'required_hours'         => 7.00,      // 7 hours total (4h + 3h)
                'late_threshold_minutes' => 15,        // 15-minute grace period
                'shift_start'            => '13:00:00', // 1:00 PM
                'shift_end'              => '21:00:00', // 9:00 PM
                'break_start'            => '17:00:00', // 5:00 PM (vacant starts)
                'break_end'              => '18:00:00', // 6:00 PM (vacant ends)
                'notes'                  => 'Split shift: 1PM-5PM, break 5-6PM, 6PM-9PM. Total 7 hours.',
                'created_at'             => $now,
                'updated_at'             => $now,
            ]);
        }
    }

    /**
     * Insert default settings (fallback when no staff users exist)
     */
    private function insertDefaultSettings(Carbon $now): void
    {
        // Default staff entries (adjust IDs based on your actual staff users)
        $defaultStaff = [
            ['id' => 8, 'name' => 'Liza Garcia'],
            ['id' => 9, 'name' => 'Rodel Aquino'],
        ];

        foreach ($defaultStaff as $staff) {
            DB::table('time_tracker_settings')->insert([
                'staff_id'               => $staff['id'],
                'tracker_enabled'        => false,
                'required_hours'         => 7.00,
                'late_threshold_minutes' => 15,
                'shift_start'            => '13:00:00',
                'shift_end'              => '21:00:00',
                'break_start'            => '17:00:00',
                'break_end'              => '18:00:00',
                'notes'                  => "Split shift for {$staff['name']}: 1PM-5PM, break 5-6PM, 6PM-9PM. Total 7 hours.",
                'created_at'             => $now,
                'updated_at'             => $now,
            ]);
        }
    }
}