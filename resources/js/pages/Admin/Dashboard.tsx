// resources/js/pages/Admin/Dashboard.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import {
    LayoutDashboard, Users, Stethoscope, PawPrint, CalendarClock,
    UserCheck, Star, Wallet, MessageSquare, ChevronRight, AlertTriangle,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { userService, appointmentService, feedbackService, paymentService } from '../../services';
import type { Appointment } from '../../services';
import { PageHeader, StatCard, C } from './_shared/AdminUI';
import { formatPHDateTime, formatPeso } from '../Shared/helpers';

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [pendingApprovals, setPendingApprovals] = useState(0);
    const [totalPetOwners, setTotalPetOwners] = useState(0);
    const [totalVets, setTotalVets] = useState(0);
    const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
    const [pendingFeedback, setPendingFeedback] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().slice(0, 10);
            const [approvals, owners, vets, appts, feedback, payments] = await Promise.all([
                userService.getPendingApprovals({ per_page: 1 }),
                userService.getPetOwners({ per_page: 1 }),
                userService.getVeterinarianAccounts({ per_page: 1 }),
                appointmentService.getAppointments({ date_from: today, date_to: today, per_page: 50 }),
                feedbackService.getFeedback({ include_unpublished: true, per_page: 1 }),
                paymentService.getPayments({ per_page: 1 }),
            ]);
            setPendingApprovals(approvals.pagination?.total ?? 0);
            setTotalPetOwners(owners.pagination?.total ?? 0);
            setTotalVets(vets.pagination?.total ?? 0);
            setTodaysAppointments(appts.data ?? []);
            setPendingFeedback(feedback.pagination?.total ?? 0);
            setTotalRevenue(payments.total_revenue ?? 0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const quickLinks = [
        { title: 'Approvals', href: '/admin/approvals', icon: UserCheck, color: C.amber, badge: pendingApprovals || undefined },
        { title: 'Pet Owners', href: '/admin/pet-owners', icon: Users, color: C.blue },
        { title: 'Veterinarians', href: '/admin/veterinarians', icon: Stethoscope, color: C.green },
        { title: 'Pets', href: '/admin/pets', icon: PawPrint, color: C.rose },
        { title: 'Appointments', href: '/admin/appointments', icon: CalendarClock, color: C.blue },
        { title: 'Feedback', href: '/admin/feedback', icon: Star, color: C.amber, badge: pendingFeedback || undefined },
        { title: 'Payments', href: '/admin/payments', icon: Wallet, color: C.green },
        { title: 'Live Chat', href: '/admin/chat', icon: MessageSquare, color: C.rose },
    ];

    return (
        <AppLayout>
            <Head title="Admin Dashboard" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={LayoutDashboard} title="Dashboard" subtitle="Clinic overview" onRefresh={fetchData} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                    {!loading && pendingApprovals > 0 && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50">
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <p className="text-sm text-amber-800 font-semibold flex-1">
                                <span className="font-bold">{pendingApprovals} pet owner account{pendingApprovals !== 1 ? 's' : ''}</span> waiting for approval.
                            </p>
                            <Link href="/admin/approvals" className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-0.5 shrink-0">
                                Review <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard icon={Users} label="Pet Owners" value={loading ? '—' : totalPetOwners} color={C.blue} />
                        <StatCard icon={Stethoscope} label="Veterinarians" value={loading ? '—' : totalVets} color={C.green} />
                        <StatCard icon={CalendarClock} label="Today's Appointments" value={loading ? '—' : todaysAppointments.length} color={C.rose} />
                        <StatCard icon={Wallet} label="Total Revenue" value={loading ? '—' : formatPeso(totalRevenue)} color={C.amber} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {quickLinks.map(q => (
                            <Link key={q.title} href={q.href}
                                className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-start gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${q.color}18` }}>
                                    <q.icon className="w-4.5 h-4.5" style={{ color: q.color }} />
                                </div>
                                <p className="text-sm font-bold text-gray-800">{q.title}</p>
                                {q.badge !== undefined && (
                                    <span className="absolute top-3 right-3 text-[10px] font-black text-white bg-red-500 rounded-full px-1.5 py-0.5">{q.badge}</span>
                                )}
                            </Link>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <p className="text-sm font-black text-gray-800">Today's Appointments</p>
                            <Link href="/admin/appointments" className="text-xs font-bold" style={{ color: C.rose }}>View all</Link>
                        </div>
                        {loading ? (
                            <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
                        ) : todaysAppointments.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-400">No appointments scheduled today.</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {todaysAppointments.slice(0, 8).map(a => (
                                    <Link key={a.id} href={`/admin/appointments/${a.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 shrink-0">
                                            <PawPrint className="w-4 h-4" style={{ color: C.rose }} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-800 truncate">{a.pet?.name ?? 'Pet'} · {a.owner?.full_name ?? a.owner?.name}</p>
                                            <p className="text-xs text-gray-400">{formatPHDateTime(`${a.appointment_date}T${a.appointment_time}`)} {a.veterinarian ? `· Dr. ${a.veterinarian.full_name ?? a.veterinarian.name}` : ''}</p>
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
