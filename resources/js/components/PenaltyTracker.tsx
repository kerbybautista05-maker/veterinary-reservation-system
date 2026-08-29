import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import {
    ChevronRight, Search, X,
    CheckCircle2, AlertCircle, Minus, RefreshCw,
    Building2, Filter,
} from 'lucide-react';
import { performanceRecordService, reportingPeriodService } from '../../services';
import type { TeacherPerformanceRecord, ReportingPeriod } from '../../services';

const C = {
    navy: '#011638', blue: '#0D21A1', bg: '#F0F2F8', gold: '#EEC643',
    green: '#059669', red: '#DC2626', amber: '#D97706',
};

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
] as const;

function fmtPeso(n: number) {
    return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function daysForPeriod(half: 1 | 2, month: number, year: number): number[] {
    if (half === 1) return Array.from({ length: 15 }, (_, i) => i + 1);
    const total = new Date(year, month, 0).getDate();
    return Array.from({ length: total - 15 }, (_, i) => i + 16);
}

function computeHalfPenalty(
    dailyData: Record<string, any> | null | undefined,
    half: 1 | 2,
    month: number,
    year: number,
): number {
    if (!dailyData) return 0;
    const days = daysForPeriod(half, month, year);
    const daySet = new Set(days.map(String));
    let total = 0;
    for (const [key, entry] of Object.entries(dailyData)) {
        if (!daySet.has(key)) continue;
        if (!entry || typeof entry !== 'object') continue;
        const status = entry.status ?? 'D';
        if (status === 'O' || status === 'L' || status === 'X') continue;
        total += Number(entry.penalty ?? 0);
    }
    return total;
}

function isHalfPaid(
    dailyData: Record<string, any> | null | undefined,
    half: 1 | 2,
    month: number,
    year: number,
    globalPaid: boolean,
): boolean {
    const key = half === 1 ? '__paid_1' : '__paid_2';
    if (!dailyData) return globalPaid;

    if (dailyData[key]?.paid === true) {
        const storedAmt = Number(dailyData[key].amount ?? 0);
        const actualAmt = computeHalfPenalty(dailyData, half, month, year);
        if (storedAmt > 0 && actualAmt > 0) return Math.abs(storedAmt - actualAmt) <= 1;
        if (storedAmt === 0) return true;
    }
    if (dailyData[key]?.paid === false) return false;

    const hasRealDays = Object.keys(dailyData).some(k => /^\d+$/.test(k));
    if (hasRealDays) return false;

    return globalPaid;
}

interface HalfStatus {
    amount: number;
    paid: boolean;
}

interface PenaltyRow {
    rec: TeacherPerformanceRecord;
    name: string;
    teacherId: string | null;
    branch: string | null;
    p1: HalfStatus;
    p2: HalfStatus;
    totalUnpaid: number;
    totalPaid: number;
}

export interface PenaltyStats {
    half1Unpaid: number;
    half1Paid: number;
    half1Count: number;
    half2Unpaid: number;
    half2Paid: number;
    half2Count: number;
    loading: boolean;
}

function StatusPill({ amount, paid }: { amount: number; paid: boolean }) {
    if (amount <= 0) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-50 text-gray-400">
                <Minus className="w-3 h-3" /> No penalty
            </span>
        );
    }
    if (paid) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="w-3 h-3" /> {fmtPeso(amount)} Paid
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3" /> {fmtPeso(amount)} Unpaid
        </span>
    );
}

export function PenaltyTracker({ onStatsChange }: { onStatsChange?: (stats: PenaltyStats) => void }) {
    const now = new Date();
    const [month,   setMonth]   = useState(now.getMonth() + 1);
    const [year,    setYear]    = useState(now.getFullYear());
    const [periods, setPeriods] = useState<ReportingPeriod[]>([]);
    const [records, setRecords] = useState<TeacherPerformanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [search,  setSearch]  = useState('');
    const [filter,  setFilter]  = useState<'all' | 'has_unpaid' | 'fully_paid' | 'p1_unpaid' | 'p2_unpaid'>('has_unpaid');

    useEffect(() => {
        reportingPeriodService.getPeriods({ per_page: 60 }).then(r => {
            if (r.success && r.data) setPeriods(r.data);
        });
    }, []);

    const selectedPeriod = periods.find(p => p.month === month && p.year === year);

    const fetchRecords = useCallback(async () => {
        if (!selectedPeriod) { setRecords([]); return; }
        setLoading(true);
        const res = await performanceRecordService.getRecords({
            reporting_period_id: selectedPeriod.id,
            per_page: 500,
        });
        if (res.success && res.data) {
            setRecords((res.data as unknown as TeacherPerformanceRecord[]).filter(r => (r as any).is_active !== false));
        } else {
            setRecords([]);
        }
        setLoading(false);
    }, [selectedPeriod]);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    const rows = useMemo((): PenaltyRow[] => {
        return records.map(rec => {
            const dd   = (rec as any).daily_data as Record<string, any> | null;
            const teacher = rec.teacher as any;
            const name = teacher?.real_name || teacher?.name || `Teacher #${rec.teacher_id}`;
            const teacherIdVal = teacher?.teacher_id ?? null;
            const branch = rec.branch?.name ?? teacher?.branch?.name ?? null;

            const p1Amount = computeHalfPenalty(dd, 1, month, year);
            const p2Amount = computeHalfPenalty(dd, 2, month, year);
            const p1Paid   = isHalfPaid(dd, 1, month, year, Boolean(rec.penalty_paid));
            const p2Paid   = isHalfPaid(dd, 2, month, year, Boolean(rec.penalty_paid));

            return {
                rec,
                name,
                teacherId: teacherIdVal,
                branch,
                p1: { amount: p1Amount, paid: p1Paid },
                p2: { amount: p2Amount, paid: p2Paid },
                totalUnpaid: (!p1Paid ? p1Amount : 0) + (!p2Paid ? p2Amount : 0),
                totalPaid:   (p1Paid  ? p1Amount : 0) + (p2Paid  ? p2Amount : 0),
            };
        }).filter(r => r.p1.amount > 0 || r.p2.amount > 0);
    }, [records, month, year]);

    const totalP1Unpaid  = rows.reduce((s, r) => s + (!r.p1.paid ? r.p1.amount : 0), 0);
    const totalP2Unpaid  = rows.reduce((s, r) => s + (!r.p2.paid ? r.p2.amount : 0), 0);
    const totalP1Paid    = rows.reduce((s, r) => s + (r.p1.paid  ? r.p1.amount : 0), 0);
    const totalP2Paid    = rows.reduce((s, r) => s + (r.p2.paid  ? r.p2.amount : 0), 0);
    const p1UnpaidCount  = rows.filter(r => r.p1.amount > 0 && !r.p1.paid).length;
    const p2UnpaidCount  = rows.filter(r => r.p2.amount > 0 && !r.p2.paid).length;

    useEffect(() => {
        onStatsChange?.({
            half1Unpaid: totalP1Unpaid,
            half1Paid:   totalP1Paid,
            half1Count:  p1UnpaidCount,
            half2Unpaid: totalP2Unpaid,
            half2Paid:   totalP2Paid,
            half2Count:  p2UnpaidCount,
            loading,
        });
    }, [totalP1Unpaid, totalP1Paid, p1UnpaidCount, totalP2Unpaid, totalP2Paid, p2UnpaidCount, loading]);

    const filtered = useMemo(() => {
        let data = rows;
        if (filter === 'has_unpaid')  data = data.filter(r => r.totalUnpaid > 0);
        if (filter === 'fully_paid')  data = data.filter(r => r.totalUnpaid === 0 && r.totalPaid > 0);
        if (filter === 'p1_unpaid')   data = data.filter(r => r.p1.amount > 0 && !r.p1.paid);
        if (filter === 'p2_unpaid')   data = data.filter(r => r.p2.amount > 0 && !r.p2.paid);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            data = data.filter(r =>
                r.name.toLowerCase().includes(q) ||
                (r.teacherId ?? '').toLowerCase().includes(q) ||
                (r.branch ?? '').toLowerCase().includes(q)
            );
        }
        return data.sort((a, b) => b.totalUnpaid - a.totalUnpaid);
    }, [rows, filter, search]);

    const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 12) { setMonth(1);  setYear(y => y + 1); } else setMonth(m => m + 1); };

    const filterBtns: { val: typeof filter; label: string; count?: number }[] = [
        { val: 'has_unpaid',  label: 'All Unpaid',     count: rows.filter(r => r.totalUnpaid > 0).length },
        { val: 'p1_unpaid',   label: 'P1 Unpaid',      count: p1UnpaidCount },
        { val: 'p2_unpaid',   label: 'P2 Unpaid',      count: p2UnpaidCount },
        { val: 'fully_paid',  label: 'Fully Paid',     count: rows.filter(r => r.totalUnpaid === 0 && r.totalPaid > 0).length },
        { val: 'all',         label: 'All w/ Penalty', count: rows.length },
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap"
                style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #0a1a6e 100%)` }}>
                <div>
                    <h2 className="text-sm font-black text-white">Penalty Tracker</h2>
                    <p className="text-white/50 text-[11px] mt-0.5">Per-half breakdown — 1st Half (1–15) · 2nd Half (16–end)</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchRecords} disabled={loading}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all border border-white/10"
                        title="Refresh">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <Link href="/admin/performance"
                        className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10">
                        Performance <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap" style={{ background: '#FAFBFF' }}>
                <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <button onClick={prevMonth} className="px-2.5 py-2 text-gray-500 hover:bg-gray-100 font-black text-sm transition-colors">‹</button>
                    <select value={month} onChange={e => setMonth(Number(e.target.value))}
                        className="px-2 py-2 text-sm font-bold bg-white text-gray-700 border-0 outline-none cursor-pointer appearance-none">
                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                    <button onClick={nextMonth} className="px-2.5 py-2 text-gray-500 hover:bg-gray-100 font-black text-sm transition-colors">›</button>
                </div>

                <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <button onClick={() => setYear(y => y - 1)} className="px-2.5 py-2 text-gray-500 hover:bg-gray-100 font-black text-sm transition-colors">‹</button>
                    <span className="px-3 py-2 text-sm font-black text-gray-700 bg-white">{year}</span>
                    <button onClick={() => setYear(y => y + 1)} className="px-2.5 py-2 text-gray-500 hover:bg-gray-100 font-black text-sm transition-colors">›</button>
                </div>

                {!selectedPeriod && !loading && (
                    <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        No reporting period for {MONTHS[month - 1]} {year}
                    </span>
                )}

                {!loading && rows.length > 0 && (
                    <div className="flex items-center gap-2 ml-auto flex-wrap">
                        {totalP1Unpaid > 0 && (
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
                                P1 Unpaid: {fmtPeso(totalP1Unpaid)} · {p1UnpaidCount}t
                            </span>
                        )}
                        {totalP2Unpaid > 0 && (
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
                                P2 Unpaid: {fmtPeso(totalP2Unpaid)} · {p2UnpaidCount}t
                            </span>
                        )}
                        {totalP1Paid > 0 && (
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200">
                                P1 Paid: {fmtPeso(totalP1Paid)}
                            </span>
                        )}
                        {totalP2Paid > 0 && (
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200">
                                P2 Paid: {fmtPeso(totalP2Paid)}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-2 flex-wrap" style={{ background: C.bg }}>
                <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                {filterBtns.map(f => (
                    <button key={f.val} onClick={() => setFilter(f.val)}
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg border transition-all ${
                            filter === f.val
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                        }`}>
                        {f.label}{f.count !== undefined ? ` (${f.count})` : ''}
                    </button>
                ))}

                <div className="relative ml-auto">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search teacher, ID, branch…"
                        className="pl-7 pr-7 py-1.5 rounded-lg border border-gray-200 text-[11px] font-medium bg-white focus:outline-none focus:ring-1 w-44"
                        style={{ '--tw-ring-color': C.blue } as React.CSSProperties} />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="divide-y divide-gray-50">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="px-5 py-3 flex items-center gap-4 animate-pulse">
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3.5 bg-gray-100 rounded w-36" />
                                <div className="h-2.5 bg-gray-100 rounded w-24" />
                            </div>
                            <div className="w-24 h-7 bg-gray-100 rounded-lg" />
                            <div className="w-24 h-7 bg-gray-100 rounded-lg" />
                            <div className="w-20 h-7 bg-gray-100 rounded-lg" />
                        </div>
                    ))}
                </div>
            ) : !selectedPeriod ? (
                <div className="py-16 text-center px-6">
                    <p className="text-gray-500 text-sm font-bold">No reporting period for {MONTHS[month - 1]} {year}</p>
                    <p className="text-gray-400 text-xs mt-1">Ask admin to create a reporting period for this month</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-16 text-center px-6">
                    <CheckCircle2 className="w-10 h-10 text-green-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm font-bold">
                        {rows.length === 0 ? 'No penalties this period' : 'No results match your filter'}
                    </p>
                    {rows.length > 0 && (
                        <button onClick={() => { setFilter('all'); setSearch(''); }} className="mt-2 text-xs font-bold text-blue-600 hover:underline">
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="hidden sm:grid grid-cols-[1.5fr_auto_auto_auto] gap-4 px-5 py-2 border-b text-[10px] font-black uppercase tracking-wider text-gray-400"
                        style={{ background: C.bg }}>
                        <span>Teacher</span>
                        <span className="w-36 text-center">1st Half (P1 · 1–15)</span>
                        <span className="w-36 text-center">2nd Half (P2 · 16–end)</span>
                        <span className="w-28 text-right">Total Unpaid</span>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {filtered.map(row => (
                            <div key={row.rec.id}
                                className={`grid grid-cols-1 sm:grid-cols-[1.5fr_auto_auto_auto] gap-3 sm:gap-4 px-5 py-3.5 items-center hover:bg-blue-50/30 transition-colors ${row.totalUnpaid > 0 ? 'border-l-2 border-l-red-300' : 'border-l-2 border-l-transparent'}`}>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="text-sm font-bold text-gray-900 truncate">{row.name}</p>
                                        {row.totalUnpaid === 0 && row.totalPaid > 0 && (
                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 flex-shrink-0">✓ Cleared</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                        {row.teacherId && <span className="text-[10px] text-gray-400 font-mono">{row.teacherId}</span>}
                                        {row.branch && (
                                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                                <Building2 className="w-2.5 h-2.5" />{row.branch}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="w-36 flex justify-center sm:justify-start">
                                    <StatusPill amount={row.p1.amount} paid={row.p1.paid} />
                                </div>

                                <div className="w-36 flex justify-center sm:justify-start">
                                    <StatusPill amount={row.p2.amount} paid={row.p2.paid} />
                                </div>

                                <div className="w-28 text-right">
                                    {row.totalUnpaid > 0 ? (
                                        <p className="text-sm font-black tabular-nums" style={{ color: C.red }}>{fmtPeso(row.totalUnpaid)}</p>
                                    ) : (
                                        <p className="text-xs font-bold text-green-600">✓ All paid</p>
                                    )}
                                    <Link href={`/admin/performance/${row.rec.id}`}
                                        className="text-[9px] font-bold text-gray-400 hover:text-blue-600 hover:underline transition-colors mt-0.5 block">
                                        View record →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2"
                        style={{ background: '#FAFBFF' }}>
                        <span className="text-[10px] text-gray-400">
                            {filtered.length} of {rows.length} teacher{rows.length !== 1 ? 's' : ''} with penalties
                            {filtered.length !== rows.length ? ` (filtered)` : ''}
                        </span>
                        <div className="flex items-center gap-3">
                            {totalP1Unpaid + totalP2Unpaid > 0 && (
                                <span className="text-[10px] font-black tabular-nums px-2 py-1 rounded-lg" style={{ background: '#FEF2F2', color: C.red, border: '1px solid #FECACA' }}>
                                    Total Unpaid: {fmtPeso(totalP1Unpaid + totalP2Unpaid)}
                                </span>
                            )}
                            {totalP1Paid + totalP2Paid > 0 && (
                                <span className="text-[10px] font-black tabular-nums px-2 py-1 rounded-lg" style={{ background: '#ECFDF5', color: C.green, border: '1px solid #A7F3D0' }}>
                                    Total Paid: {fmtPeso(totalP1Paid + totalP2Paid)}
                                </span>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default PenaltyTracker;