// resources/js/pages/Admin/Calendar.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { appointmentService } from '../../services';
import type { CalendarResponse } from '../../services';
import { PageHeader, C } from './_shared/AdminUI';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_STYLES: Record<string, string> = {
    pending:   'bg-amber-100 text-amber-700',
    approved:  'bg-green-100 text-green-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    canceled:  'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
};

function statusClass(status?: string): string {
    return STATUS_STYLES[status?.toLowerCase() ?? ''] ?? 'bg-gray-100 text-gray-700';
}

function dateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildMonthMatrix(year: number, month: number): Date[][] {
    const first = new Date(year, month, 1);
    const gridStart = new Date(year, month, 1 - first.getDay());
    const weeks: Date[][] = [];
    let cursor = new Date(gridStart);
    for (let w = 0; w < 6; w++) {
        const row: Date[] = [];
        for (let d = 0; d < 7; d++) { row.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1); }
        weeks.push(row);
    }
    return weeks;
}

export default function AdminCalendar() {
    const [cursor, setCursor] = useState(new Date());
    const [data, setData] = useState<CalendarResponse>({});
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const weeks = buildMonthMatrix(year, month);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const start = dateKey(weeks[0][0]);
        const end = dateKey(weeks[weeks.length - 1][6]);
        const res = await appointmentService.getCalendar({ start, end });
        if (res.success) setData(res.data ?? {});
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, month]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <AppLayout>
            <Head title="Calendar" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={CalendarDays} title="Calendar" subtitle="Clinic-wide appointment calendar" onRefresh={fetchData} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <p className="text-sm font-black text-gray-800">{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={() => setCursor(new Date())} className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50">Today</button>
                                <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 border-b border-gray-100">
                            {WEEKDAYS.map(d => <div key={d} className="text-center text-[11px] font-black text-gray-400 py-2">{d}</div>)}
                        </div>

                        <div className="grid grid-cols-7">
                            {weeks.flat().map((d, i) => {
                                const key = dateKey(d);
                                const dayAppts = data[key] ?? [];
                                const isCurrentMonth = d.getMonth() === month;
                                const isToday = key === dateKey(new Date());
                                return (
                                    <div key={i} className={`min-h-[110px] border-b border-r border-gray-50 p-1.5 ${isCurrentMonth ? '' : 'bg-gray-50/50'}`}>
                                        <p className={`text-[11px] font-bold mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                                            isToday ? 'text-white' : isCurrentMonth ? 'text-gray-600' : 'text-gray-300'
                                        }`} style={isToday ? { background: C.rose } : undefined}>
                                            {d.getDate()}
                                        </p>
                                        <div className="space-y-0.5">
                                            {dayAppts.slice(0, 3).map(a => (
                                                <Link key={a.id} href={`/admin/appointments/${a.id}`}
                                                    className={`block text-[10px] font-semibold px-1.5 py-0.5 rounded truncate ${statusClass(a.status)} ${a.type === 'emergency' ? 'border-l-2 border-red-500' : ''}`}>
                                                    {a.appointment_time?.slice(0, 5)} {a.pet?.name}
                                                </Link>
                                            ))}
                                            {dayAppts.length > 3 && (
    <button
        type="button"
        onClick={() => setSelectedDay(key)}
        className="text-[10px] font-semibold text-gray-500 hover:text-gray-800 hover:underline px-1.5">
        +{dayAppts.length - 3} more
    </button>
)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {loading && <div className="p-4 text-center text-xs text-gray-400">Loading…</div>}
                    </div>
                </div>
            </div>
            {selectedDay && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
         onClick={() => setSelectedDay(null)}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto"
             onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
                <p className="text-sm font-black text-gray-800">
                    {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-700 text-lg leading-none">×</button>
            </div>
            <div className="p-4 space-y-1.5">
                {(data[selectedDay] ?? []).map(a => (
                    <Link key={a.id} href={`/admin/appointments/${a.id}`}
                        className={`block text-xs font-semibold px-3 py-2 rounded-lg ${statusClass(a.status)} ${a.type === 'emergency' ? 'border-l-4 border-red-500' : ''}`}>
                        {a.appointment_time?.slice(0, 5)} · {a.pet?.name}
                    </Link>
                ))}
            </div>
        </div>
    </div>
)}
        </AppLayout>
    );
}
