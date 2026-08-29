// resources/js/pages/Vet/Dashboard.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { LayoutDashboard, CalendarClock, Users, Clock, ChevronRight, Stethoscope } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { veterinarianService, appointmentService } from '@/services';
import type { Appointment, VeterinarianDashboardStats } from '@/services';
import { PageHeader, StatCard, PetAvatar, C } from '@/pages/Vet/_shared/VetUI';
import { formatPHDateTime } from '@/pages/Shared/helpers';

export default function VetDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<VeterinarianDashboardStats | null>(null);
    const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().slice(0, 10);
            const [statsRes, apptRes] = await Promise.all([
                veterinarianService.getDashboard(),
                appointmentService.getAppointments({ date_from: today, date_to: today, per_page: 50 }),
            ]);
            if (statsRes.success) setStats(statsRes.data ?? null);
            if (apptRes.success) setTodaysAppointments(apptRes.data ?? []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={LayoutDashboard} title="Dashboard" subtitle="Your day at a glance" onRefresh={fetchData} />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard icon={CalendarClock} label="Today's Appointments" value={loading ? '—' : stats?.todays_appointments ?? 0} color={C.blue} />
                        <StatCard icon={Clock} label="Pending Confirmation" value={loading ? '—' : stats?.pending_appointments ?? 0} color={C.amber} />
                        <StatCard icon={Users} label="Total Patients" value={loading ? '—' : stats?.total_patients ?? 0} color={C.navy} />
                        <StatCard icon={Stethoscope} label="Unread Alerts" value={loading ? '—' : stats?.unread_notifications ?? 0} color={C.red} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Link href="/vet/appointments" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${C.blue}18` }}>
                                <CalendarClock className="w-4.5 h-4.5" style={{ color: C.blue }} />
                            </div>
                            <p className="text-sm font-bold text-gray-800">View Appointments</p>
                        </Link>
                        <Link href="/vet/patients" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${C.navy}18` }}>
                                <Users className="w-4.5 h-4.5" style={{ color: C.navy }} />
                            </div>
                            <p className="text-sm font-bold text-gray-800">Search Patients</p>
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <p className="text-sm font-black text-gray-800">Today's Appointments</p>
                            <Link href="/vet/calendar" className="text-xs font-bold flex items-center gap-0.5" style={{ color: C.blue }}>Calendar <ChevronRight className="w-3 h-3" /></Link>
                        </div>
                        {loading ? (
                            <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
                        ) : todaysAppointments.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-400">No appointments scheduled today.</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {todaysAppointments.map(a => (
                                    <Link key={a.id} href={`/vet/appointments/${a.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                                        <PetAvatar photoUrl={a.pet?.photo_url} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-800 truncate">
                                                {a.pet?.name ?? 'Pet'} · {a.owner?.full_name ?? a.owner?.name}
                                                {a.is_emergency && <span className="ml-2 text-[10px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">EMERGENCY</span>}
                                            </p>
                                            <p className="text-xs text-gray-400">{formatPHDateTime(`${a.appointment_date}T${a.appointment_time}`)}</p>
                                        </div>
                                        <span className="text-[11px] font-bold text-gray-500 capitalize">{a.status_label ?? a.status}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
