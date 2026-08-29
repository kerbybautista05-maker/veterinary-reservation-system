<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TimeTrackerSeeder extends Seeder
{
    /**
     * Seed the time_tracker table with sample/demo data for testing.
     * 
     * In production, records are created in real-time when staff members
     * clock in/out via the portal while the tracker is active.
     * 
     * This seeder is intended for:
     *   - Development/testing environments
     *   - Demonstrating the split shift functionality
     *   - Populating demo data for UI preview
     * 
     * Split Shift Schedule:
     *   First Shift:   1:00 PM - 5:00 PM  (4 hours)
     *   Break/Vacant:  5:00 PM - 6:00 PM  (1 hour)
     *   Second Shift:  6:00 PM - 9:00 PM  (3 hours)
     */
    public function run(): void
    {
        // Only seed in non-production environments
        if (app()->environment('production')) {
            $this->command->info('Skipping TimeTrackerSeeder in production mode.');
            return;
        }

        $now = Carbon::now();
        $today = Carbon::today();
        
        // Sample data for the last 30 days
        $sampleEntries = $this->generateSampleEntries($now);
        
        foreach ($sampleEntries as $entry) {
            // Check if entry already exists to avoid duplicates
            $exists = DB::table('time_tracker')
                ->where('staff_id', $entry['staff_id'])
                ->where('work_date', $entry['work_date'])
                ->exists();
            
            if (!$exists) {
                DB::table('time_tracker')->insert($entry);
            }
        }
        
        $this->command->info('TimeTrackerSeeder completed. Inserted ' . count($sampleEntries) . ' sample entries.');
    }
    
    /**
     * Generate sample time tracker entries for demo purposes
     */
    private function generateSampleEntries(Carbon $now): array
    {
        $entries = [];
        $staffIds = [8, 9]; // Adjust based on your actual staff IDs
        
        // Get staff names for reference (optional)
        $staffNames = DB::table('users')
            ->whereIn('id', $staffIds)
            ->pluck('first_name', 'id')
            ->toArray();
        
        foreach ($staffIds as $staffId) {
            // Generate entries for the last 30 days
            for ($i = 0; $i < 30; $i++) {
                $date = Carbon::today()->subDays($i);
                
                // Skip weekends (optional - adjust based on your schedule)
                if ($date->isSaturday() || $date->isSunday()) {
                    continue;
                }
                
                // Determine if this day should have a record (80% attendance rate for demo)
                $hasRecord = rand(1, 100) <= 80;
                
                if ($hasRecord) {
                    $entry = $this->generateEntryForDate($staffId, $date, $staffNames[$staffId] ?? 'Staff');
                    if ($entry) {
                        $entries[] = $entry;
                    }
                }
            }
        }
        
        return $entries;
    }
    
    /**
     * Generate a single entry for a specific date
     */
    private function generateEntryForDate(int $staffId, Carbon $date, string $staffName): ?array
    {
        // Randomize status based on realistic patterns
        $random = rand(1, 100);
        
        if ($random <= 70) {
            // Present (on time)
            $status = 'present';
            $timeIn = '13:00:00';
            $timeOut = '21:00:00';
            $breakStart = '17:00:00';
            $breakEnd = '18:00:00';
            $hoursWorked = 7.00;
        } elseif ($random <= 85) {
            // Late (arrived after 1:15 PM)
            $status = 'late';
            $lateMinutes = rand(5, 45);
            $timeIn = sprintf('13:%02d:00', 15 + $lateMinutes);
            $timeOut = '21:00:00';
            $breakStart = '17:00:00';
            $breakEnd = '18:00:00';
            // Calculate actual hours worked (late arrival reduces hours)
            $hoursWorked = 7.00 - ($lateMinutes / 60);
            $hoursWorked = round($hoursWorked, 2);
        } elseif ($random <= 95) {
            // Half day (left early or came late significantly)
            $status = 'half_day';
            $timeIn = '13:00:00';
            $timeOut = '17:00:00'; // Left after first shift only
            $breakStart = null;
            $breakEnd = null;
            $hoursWorked = 4.00;
        } else {
            // Absent (no record)
            return null;
        }
        
        // Add some variation for break times
        if ($breakStart && $breakEnd && $status !== 'half_day') {
            $breakStartVar = rand(-5, 5);
            $breakEndVar = rand(-5, 5);
            $breakStart = sprintf('17:%02d:00', max(0, min(59, $breakStartVar)));
            $breakEnd = sprintf('18:%02d:00', max(0, min(59, $breakEndVar)));
        }
        
        return [
            'staff_id'     => $staffId,
            'work_date'    => $date->toDateString(),
            'time_in'      => $timeIn,
            'break_start'  => $breakStart,
            'break_end'    => $breakEnd,
            'time_out'     => $timeOut,
            'hours_worked' => $hoursWorked,
            'status'       => $status,
            'notes'        => "Sample entry for {$staffName} - " . ucfirst($status),
            'created_at'   => $date->copy()->setTime(13, 0, 0),
            'updated_at'   => $date->copy()->setTime(21, 0, 0),
        ];
    }
}