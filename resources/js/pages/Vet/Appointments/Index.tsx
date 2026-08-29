// resources/js/pages/Vet/Appointments/Index.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { CalendarClock, Filter } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { appointmentService } from '@/services';
import type { Appointment, AppointmentStatus } from '@/services';
import { PageHeader, StatusPill, PetAvatar, EmptyState, Pagination, C } from '@/pages/Vet/_shared/VetUI';
import { formatPHDateTime } from '@/pages/Shared/helpers';

const STATUS_FILTERS: { value: AppointmentStatus | ''; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no_show', label: 'No-show' },
];

export default function VetAppointmentsIndex() {
    const [appts, setAppts] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<AppointmentStatus | ''>('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(undefined);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await appointmentService.getAppointments({ page, per_page: 15, status: status || undefined });
        if (res.success) { setAppts(res.data ?? []); setPagination(res.pagination); }
        setLoading(false);
    }, [page, status]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <AppLayout>
            <Head title="Appointments" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={CalendarClock} title="Appointments" subtitle="Your assigned bookings" onRefresh={fetchData} />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="w-4 h-4 text-gray-400" />
                        {STATUS_FILTERS.map(f => (
                            <button key={f.value} onClick={() => { setStatus(f.value); setPage(1); }}
                                className="px-3 py-1.5 rounded-full text-xs font-bold border transition-colors"
                                style={status === f.value ? { background: C.blue, color: '#fff', borderColor: C.blue } : { background: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }}>
                                {f.label}
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
                                    <Link key={a.id} href={`/vet/appointments/${a.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                                        <PetAvatar photoUrl={a.pet?.photo_url} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-800 truncate">
                                                {a.pet?.name ?? 'Pet'} · {a.owner?.full_name ?? a.owner?.name}
                                                {a.is_emergency && <span className="ml-2 text-[10px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">EMERGENCY</span>}
                                            </p>
                                            <p className="text-xs text-gray-400">{formatPHDateTime(`${a.appointment_date}T${a.appointment_time}`)}</p>
                                        </div>
                                        <StatusPill label={a.status_label ?? a.status} color={a.status_color} />
                                    </Link>
                                ))}
                            </div>
                        )}
                        <Pagination pagination={pagination} onPageChange={setPage} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
