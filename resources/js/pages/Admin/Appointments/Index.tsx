// resources/js/pages/Admin/Appointments/Index.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { CalendarClock, Eye, Filter, Siren, Plus } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { appointmentService } from '../../../services';
import type { Appointment, AppointmentStatus } from '../../../services';
import { PageHeader, StatusPill, EmptyState, Pagination, C } from '../_shared/AdminUI';
import { formatPHDateTime } from '../../Shared/helpers';
import WalkInModal from './WalkInModal';

const STATUS_FILTERS: { value: AppointmentStatus | ''; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no_show', label: 'No-show' },
];

interface EmergencyItem {
    id: number;
    pet_name: string;
    owner_name: string;
    reason: string | null;
    appointment_date: string;
    appointment_time: string;
    created_at: string;
    time_ago: string;
}

export default function AppointmentsIndex() {
    const [appts, setAppts] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<AppointmentStatus | ''>('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(undefined);
    const [pendingCount, setPendingCount] = useState(0);
    const [emergencies, setEmergencies] = useState<EmergencyItem[]>([]);
    const [showWalkIn, setShowWalkIn] = useState(false);

    const fetchPendingCount = useCallback(async () => {
        try {
            const res = await appointmentService.getAppointments({ status: 'pending', per_page: 1 });
            if (res.success && res.pagination) setPendingCount(res.pagination.total ?? 0);
        } catch { /* silent */ }
    }, []);

    const fetchEmergencies = useCallback(async () => {
        try {
            const res = await appointmentService.getEmergencyPending();
            if (res.success) setEmergencies(res.data ?? []);
        } catch { /* silent */ }
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await appointmentService.getAppointments({ page, per_page: 15, status: status || undefined });
        if (res.success) { setAppts(res.data ?? []); setPagination(res.pagination); }
        setLoading(false);
        fetchPendingCount();
        fetchEmergencies();
    }, [page, status, fetchPendingCount, fetchEmergencies]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => {
        const interval = setInterval(fetchEmergencies, 30000);
        return () => clearInterval(interval);
    }, [fetchEmergencies]);

    return (
        <AppLayout>
            <Head title="Appointments" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={CalendarClock} title="Appointments" subtitle="All bookings across the clinic" onRefresh={fetchData}
                    action={
                        <button onClick={() => setShowWalkIn(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-xs font-bold transition-all border border-white/20 hover:bg-white/90"
                            style={{ color: C.rose }}>
                            <Plus className="w-3.5 h-3.5" /> Log Walk-in
                        </button>
                    }
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    {emergencies.length > 0 && (
                        <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Siren className="w-5 h-5 text-red-600" />
                                    <p className="text-sm font-bold text-red-800">
                                        {emergencies.length} Emergency Request{emergencies.length !== 1 ? 's' : ''} need attention
                                    </p>
                                </div>
                                <Link href="/admin/appointments?type=emergency&status=pending"
                                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors">
                                    View All
                                </Link>
                            </div>
                            <div className="space-y-2">
                                {emergencies.slice(0, 3).map(e => (
                                    <Link key={e.id} href={`/admin/appointments/${e.id}`}
                                        className="flex items-center justify-between gap-3 bg-white rounded-lg px-4 py-3 border border-red-100 hover:border-red-300 transition-colors">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-800 truncate">
                                                {e.pet_name} <span className="font-normal text-gray-500">({e.owner_name})</span>
                                            </p>
                                            {e.reason && <p className="text-xs text-gray-500 truncate">{e.reason}</p>}
                                            <p className="text-[11px] text-gray-400 mt-0.5">{e.time_ago}</p>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-[11px] font-bold whitespace-nowrap">
                                            Respond
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="w-4 h-4 text-gray-400" />
                        {STATUS_FILTERS.map(f => (
                            <button key={f.value} onClick={() => { setStatus(f.value); setPage(1); }}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                                    status === f.value ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-500 border-gray-200 hover:border-rose-300'
                                }`}>
                                {f.label}
                                {f.value === 'pending' && pendingCount > 0 && (
                                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                        status === 'pending' ? 'bg-white/25 text-white' : 'bg-red-100 text-red-600'
                                    }`}>
                                        {pendingCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
                        ) : appts.length === 0 ? (
                            <EmptyState icon={CalendarClock} title="No appointments found" />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {appts.map(a => (
                                    <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-800 truncate">
                                                {a.pet?.name ?? 'Pet'} · {a.owner?.full_name ?? a.owner?.name}
                                                {a.is_emergency && <span className="ml-2 text-[10px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">EMERGENCY</span>}
                                            </p>
                                            <p className="text-xs text-gray-400">{formatPHDateTime(`${a.appointment_date}T${a.appointment_time}`)} {a.veterinarian ? `· Dr. ${a.veterinarian.full_name ?? a.veterinarian.name}` : '· Unassigned'}</p>
                                        </div>
                                        <StatusPill label={a.status_label ?? a.status} color={a.status_color} />
                                        <Link href={`/admin/appointments/${a.id}`} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"><Eye className="w-4 h-4" /></Link>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Pagination pagination={pagination} onPageChange={setPage} />
                    </div>
                </div>
            </div>
            <WalkInModal open={showWalkIn} onClose={() => setShowWalkIn(false)} onSuccess={fetchData} />
        </AppLayout>
    );
}
