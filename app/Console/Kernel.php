<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        // Register your custom commands here
        \App\Console\Commands\AutoTimeTracker::class,
        \App\Console\Commands\CleanupExpiredData::class,
        \App\Console\Commands\SendContractAlerts::class,
        \App\Console\Commands\SendDailyDigest::class,
        \App\Console\Commands\MarkIncompleteAttendance::class,
        \App\Console\Commands\GenerateMonthlyRankings::class,
        \App\Console\Commands\GenerateRecurringCommissions::class,
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        // ─────────────────────────────────────────────────────────────────────
        // TIME TRACKER AUTO OPERATIONS (Split Shift: 1PM-5PM, Break 5-6PM, 6PM-9PM)
        // ─────────────────────────────────────────────────────────────────────
        
        // Run every minute for precise auto clock-in/out during grace periods
        $schedule->command('timetracker:auto')->everyMinute();
        
        // Backup scheduled runs at exact times
        $schedule->command('timetracker:auto --action=clock-in')->dailyAt('13:00');      // 1:00 PM - Clock In
        $schedule->command('timetracker:auto --action=clock-in')->dailyAt('13:05');     // 1:05 PM - Backup
        $schedule->command('timetracker:auto --action=clock-in')->dailyAt('13:10');     // 1:10 PM - Backup
        $schedule->command('timetracker:auto --action=clock-in')->dailyAt('13:15');     // 1:15 PM - Last call
        
        $schedule->command('timetracker:auto --action=start-break')->dailyAt('17:00');   // 5:00 PM - Break Start
        $schedule->command('timetracker:auto --action=start-break')->dailyAt('17:05');   // 5:05 PM - Backup
        
        $schedule->command('timetracker:auto --action=end-break')->dailyAt('18:00');     // 6:00 PM - Break End
        $schedule->command('timetracker:auto --action=end-break')->dailyAt('18:05');     // 6:05 PM - Backup
        
        $schedule->command('timetracker:auto --action=clock-out')->dailyAt('21:00');     // 9:00 PM - Clock Out
        $schedule->command('timetracker:auto --action=clock-out')->dailyAt('21:05');     // 9:05 PM - Backup
        $schedule->command('timetracker:auto --action=clock-out')->dailyAt('21:10');     // 9:10 PM - Backup
        $schedule->command('timetracker:auto --action=clock-out')->dailyAt('21:15');     // 9:15 PM - Last call
        
        // Mark incomplete attendance at midnight (for those who forgot to clock out)
        $schedule->command('timetracker:mark-incomplete')->dailyAt('23:59');
        
        // Clean up old time tracker entries (keep last 3 months)
        $schedule->command('timetracker:cleanup')->monthly();
        
        // ─────────────────────────────────────────────────────────────────────
        // NOTIFICATION & ALERT OPERATIONS
        // ─────────────────────────────────────────────────────────────────────
        
        // Send contract expiration alerts daily at 8:00 AM
        $schedule->command('contracts:send-alerts')->dailyAt('08:00');
        
        // Send daily digest for staff (pending tasks, reminders) at 9:00 AM
        $schedule->command('digest:daily --role=staff')->dailyAt('09:00');
        
        // Send daily digest for teachers at 8:30 AM
        $schedule->command('digest:daily --role=teacher')->dailyAt('08:30');
        
        // Send daily digest for team leaders at 8:15 AM
        $schedule->command('digest:daily --role=team-leader')->dailyAt('08:15');
        
        // Send weekly summary every Monday at 7:00 AM
        $schedule->command('digest:weekly')->weekly()->mondays()->at('07:00');
        
        // ─────────────────────────────────────────────────────────────────────
        // RANKING & PERFORMANCE OPERATIONS
        // ─────────────────────────────────────────────────────────────────────
        
        // Generate monthly rankings on the 1st of each month at 2:00 AM
        $schedule->command('rankings:generate')->monthlyOn(1, '02:00');
        
        // Update performance scores daily at 1:00 AM
        $schedule->command('performance:update-scores')->dailyAt('01:00');
        
        // Flag teachers needing attention daily at 3:00 AM
        $schedule->command('performance:flag-attention')->dailyAt('03:00');
        
        // ─────────────────────────────────────────────────────────────────────
        // ATTENDANCE SELFIE REMINDERS
        // ─────────────────────────────────────────────────────────────────────
        
        // Send reminder to teachers to upload attendance selfie at 7:00 PM
        $schedule->command('attendance:remind-selfie')->dailyAt('19:00');
        
        // Auto-verify attendance selfies after 24 hours (for admin review)
        $schedule->command('attendance:auto-verify')->dailyAt('02:00');
        
        // ─────────────────────────────────────────────────────────────────────
        // NON-USAGE REQUEST AUTO-PROCESSING
        // ─────────────────────────────────────────────────────────────────────
        
        // Auto-reject pending requests older than 7 days at midnight
        $schedule->command('requests:auto-reject-expired')->dailyAt('00:00');
        
        // Auto-approve long-term requests that meet criteria (if enabled)
        $schedule->command('requests:auto-approve-long-term')->dailyAt('10:00');
        
        // ─────────────────────────────────────────────────────────────────────
        // REFUND AUTO-PROCESSING
        // ─────────────────────────────────────────────────────────────────────
        
        // Auto-mark refunds as paid after 30 days of approval (if configured)
        $schedule->command('refunds:auto-mark-paid')->dailyAt('04:00');
        
        // ─────────────────────────────────────────────────────────────────────
        // DATABASE CLEANUP & MAINTENANCE
        // ─────────────────────────────────────────────────────────────────────
        
        // Clean up activity logs older than 6 months daily at 3:30 AM
        $schedule->command('logs:cleanup --days=180')->dailyAt('03:30');
        
        // Clean up login logs older than 3 months daily at 4:00 AM
        $schedule->command('logs:cleanup-login --days=90')->dailyAt('04:00');
        
        // Clean up notifications older than 30 days (read only) daily at 5:00 AM
        $schedule->command('notifications:cleanup --days=30')->dailyAt('05:00');
        
        // Prune abandoned sessions daily at 6:00 AM
        $schedule->command('session:prune')->dailyAt('06:00');
        
        // Backup database daily at 1:00 AM (production only)
        if (app()->environment('production')) {
            $schedule->command('backup:run')->dailyAt('01:00');
        }
        
        // ─────────────────────────────────────────────────────────────────────
        // CHALLENGE & ANNOUNCEMENT OPERATIONS
        // ─────────────────────────────────────────────────────────────────────
        
        // Auto-activate/publish scheduled challenges daily at 8:00 AM
        $schedule->command('challenges:auto-activate')->dailyAt('08:00');
        
        // Auto-deactivate expired challenges daily at 9:00 PM
        $schedule->command('challenges:auto-deactivate')->dailyAt('21:00');
        
        // Auto-publish scheduled announcements every hour
        $schedule->command('announcements:auto-publish')->hourly();
        
        // ─────────────────────────────────────────────────────────────────────
        // REPORTING PERIOD OPERATIONS
        // ─────────────────────────────────────────────────────────────────────
        
        // Auto-create next month's reporting period on the 25th at 12:00 AM
        $schedule->command('reporting-periods:create-next')->monthlyOn(25, '00:00');
        
        // Auto-lock previous reporting period on the 5th of each month at 12:00 AM
        $schedule->command('reporting-periods:lock-previous')->monthlyOn(5, '00:00');
        
        // ─────────────────────────────────────────────────────────────────────
        // SYSTEM HEALTH CHECKS
        // ─────────────────────────────────────────────────────────────────────
        
        // Run health check every hour
        $schedule->command('health:check')->hourly();
        
        // Send system health report daily at 6:00 AM (admin only)
        if (app()->environment('production')) {
            $schedule->command('health:report')->dailyAt('06:00');
        }
        
        // ─────────────────────────────────────────────────────────────────────
        // QUEUE WORKER (if using queues)
        // ─────────────────────────────────────────────────────────────────────
        
        // Restart queue worker daily to prevent memory leaks
        $schedule->command('queue:restart')->dailyAt('02:30');
        
        // Monitor queue size every 15 minutes
        $schedule->command('queue:monitor --max=1000')->everyFifteenMinutes();

        // ─────────────────────────────────────────────────────────────────────
        // TEACHER LAUNCH COMMISSIONS
        // ─────────────────────────────────────────────────────────────────────

        // Auto-generate the next cutoff's recurring commission instances.
        // Runs daily at 1:00 AM; the command itself only acts on the 1st and
        // 16th (start of each cutoff), so it's safe to leave running daily.
        $schedule->command('commissions:generate-recurring')->dailyAt('01:00');
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
    
    /**
     * Get the timezone that should be used by default for scheduled events.
     *
     * @return \DateTimeZone|string|null
     */
    protected function scheduleTimezone()
    {
        return 'Asia/Manila'; // Philippine Time (PHT)
    }
}