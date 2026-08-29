<?php

namespace App\Console\Commands;

use App\Models\StaffTeacherCommission;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Auto-generates the next recurring commission instance for every active
 * recurring chain (staff+teacher pairs flagged is_recurring with an
 * approved/paid commission) — one new pending row per cutoff, carrying
 * forward the last approved amount as a default for Admin to confirm/edit.
 *
 * Schedule this to run daily; it only actually creates rows on the 1st
 * and 16th of the month (the start of each cutoff), and skips any
 * staff+teacher pair that already has a row for the target period —
 * safe to run more than once a day if needed.
 */
class GenerateRecurringCommissions extends Command
{
    protected $signature = 'commissions:generate-recurring
                            {--year= : Override target year (defaults to today)}
                            {--month= : Override target month (defaults to today)}
                            {--cutoff= : Override target cutoff (first|second, defaults to today)}
                            {--force : Generate even if today isn\'t the 1st or 16th}';

    protected $description = 'Auto-generate the next cutoff\'s recurring teacher-launch commission instances';

    public function handle(): int
    {
        $today = now();
        $day   = (int) $today->format('d');

        if (!$this->option('force') && $day !== 1 && $day !== 16) {
            $this->info("Today ({$today->toDateString()}) is not the start of a cutoff (1st or 16th). Nothing to do. Use --force to override.");
            return self::SUCCESS;
        }

        $year   = (int) ($this->option('year') ?: $today->format('Y'));
        $month  = (int) ($this->option('month') ?: $today->format('m'));
        $cutoff = $this->option('cutoff') ?: ($day <= 15 ? 'first' : 'second');

        $created = StaffTeacherCommission::generateRecurringForPeriod($year, $month, $cutoff);

        $this->info("Generated {$created->count()} recurring commission instance(s) for {$year}-{$month} ({$cutoff} cutoff).");

        if ($created->isNotEmpty()) {
            Log::info('Recurring commissions auto-generated', [
                'year' => $year, 'month' => $month, 'cutoff' => $cutoff,
                'count' => $created->count(),
                'ids' => $created->pluck('id'),
            ]);
        }

        return self::SUCCESS;
    }
}
