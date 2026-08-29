<?php
// app/Console/Commands/AutoTimeTracker.php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\TimeTracker;
use App\Models\TimeTrackerSetting;
use Carbon\Carbon;
use Illuminate\Console\Command;

class AutoTimeTracker extends Command
{
    protected $signature = 'timetracker:auto {--action=} {--staff-id=}';
    protected $description = 'Auto clock-in/out staff based on schedule (PH time)';

    public function handle()
    {
        // ── Always work in PH time ────────────────────────────────────────────
        $now     = Carbon::now(config('app.timezone', 'Asia/Manila'));
        $today   = $now->toDateString();

        $action  = $this->option('action');
        $staffId = $this->option('staff-id');

        if ($action === 'clock-in')     { $this->autoClockIn($staffId, $now, $today); }
        elseif ($action === 'start-break') { $this->autoStartBreak($staffId, $now, $today); }
        elseif ($action === 'end-break')   { $this->autoEndBreak($staffId, $now, $today); }
        elseif ($action === 'clock-out')   { $this->autoClockOut($staffId, $now, $today); }
        else                               { $this->runAllAutoChecks($now, $today); }
    }

    private function runAllAutoChecks(Carbon $now, string $today)
    {
        $currentTime = $now->format('H:i');

        $staffMembers = User::staff()
            ->active()
            ->whereHas('timeTrackerSetting', fn($q) => $q->where('tracker_enabled', true))
            ->get();

        foreach ($staffMembers as $staff) {
            $todayEntry = TimeTracker::where('staff_id', $staff->id)
                ->whereDate('work_date', $today)
                ->first();

            // Auto clock-in 1:00 PM – 1:15 PM
            if (!$todayEntry || !$todayEntry->time_in) {
                if ($currentTime >= '13:00' && $currentTime <= '13:15') {
                    $this->autoClockIn($staff->id, $now, $today);
                }
            }

            // Auto start break 5:00 PM – 5:05 PM
            if ($todayEntry && $todayEntry->time_in && !$todayEntry->break_start) {
                if ($currentTime >= '17:00' && $currentTime <= '17:05') {
                    $this->autoStartBreak($staff->id, $now, $today);
                }
            }

            // Auto end break 6:00 PM – 6:05 PM
            if ($todayEntry && $todayEntry->break_start && !$todayEntry->break_end) {
                if ($currentTime >= '18:00' && $currentTime <= '18:05') {
                    $this->autoEndBreak($staff->id, $now, $today);
                }
            }

            // Auto clock-out 9:00 PM – 9:15 PM
            if ($todayEntry && $todayEntry->time_in && !$todayEntry->time_out) {
                if ($currentTime >= '21:00' && $currentTime <= '21:15') {
                    $this->autoClockOut($staff->id, $now, $today);
                }
            }
        }
    }

    private function autoClockIn($staffId, Carbon $now, string $today)
    {
        $entry = TimeTracker::where('staff_id', $staffId)
            ->whereDate('work_date', $today)
            ->first();

        if ($entry && $entry->time_in) return;

        $isLate = $now->format('H:i:s') > '13:15:00';

        TimeTracker::updateOrCreate(
            ['staff_id' => $staffId, 'work_date' => $today],
            [
                'time_in' => $now->format('H:i:s'),
                'status'  => $isLate ? 'late' : 'present',
                'notes'   => 'Auto clock-in by system',
            ]
        );

        $this->info("Auto clock-in for staff ID: {$staffId} at {$now->format('h:i:s A')} PH");
    }

    private function autoStartBreak($staffId, Carbon $now, string $today)
    {
        $entry = TimeTracker::where('staff_id', $staffId)
            ->whereDate('work_date', $today)
            ->first();

        if (!$entry || $entry->break_start) return;

        $entry->update([
            'break_start' => $now->format('H:i:s'),
            'notes'       => ($entry->notes ? $entry->notes . ' | ' : '') . 'Auto break start',
        ]);

        $this->info("Auto break start for staff ID: {$staffId} at {$now->format('h:i A')} PH");
    }

    private function autoEndBreak($staffId, Carbon $now, string $today)
    {
        $entry = TimeTracker::where('staff_id', $staffId)
            ->whereDate('work_date', $today)
            ->first();

        if (!$entry || !$entry->break_start || $entry->break_end) return;

        $entry->update([
            'break_end' => $now->format('H:i:s'),
            'notes'     => ($entry->notes ? $entry->notes . ' | ' : '') . 'Auto break end',
        ]);

        $this->info("Auto break end for staff ID: {$staffId} at {$now->format('h:i A')} PH");
    }

    private function autoClockOut($staffId, Carbon $now, string $today)
    {
        $entry = TimeTracker::where('staff_id', $staffId)
            ->whereDate('work_date', $today)
            ->first();

        if (!$entry || !$entry->time_in || $entry->time_out) return;

        $timeIn = Carbon::createFromTimeString($entry->time_in);

        $firstShiftEnd    = $entry->break_start
            ? Carbon::createFromTimeString($entry->break_start)
            : Carbon::createFromTimeString('17:00:00');
        $firstShiftHours  = $timeIn->diffInMinutes($firstShiftEnd) / 60;

        $secondShiftStart = $entry->break_end
            ? Carbon::createFromTimeString($entry->break_end)
            : Carbon::createFromTimeString('18:00:00');
        $secondShiftHours = $secondShiftStart->diffInMinutes($now) / 60;

        $hoursWorked = round($firstShiftHours + $secondShiftHours, 2);

        $entry->update([
            'time_out'     => $now->format('H:i:s'),
            'hours_worked' => $hoursWorked,
            'notes'        => ($entry->notes ? $entry->notes . ' | ' : '') . 'Auto clock-out',
        ]);

        $this->info("Auto clock-out for staff ID: {$staffId} at {$now->format('h:i A')} PH — Hours: {$hoursWorked}");
    }
}