// resources/js/pages/Owner/Dashboard.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import {
    LayoutDashboard, PawPrint, CalendarClock, HeartPulse, Plus,
    ChevronRight, Siren, Megaphone,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { petService, appointmentService, healthReminderService, announcementService } from '@/services';
import type { Pet, Appointment, HealthReminder, Announcement } from '@/services';
import { PageHeader, StatCard, PetAvatar, C } from '@/pages/Owner/_shared/OwnerUI';
import { formatPHDateTime } from '@/pages/Shared/helpers';

export default function OwnerDashboard() {
    const [loading, setLoading] = useState(true);
    const [pets, setPets] = useState<Pet[]>([]);
    const [upcoming, setUpcoming] = useState<Appointment[]>([]);
    const [reminders, setReminders] = useState<HealthReminder[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [petsRes, apptRes, reminderRes, annRes] = await Promise.all([
                petService.getPets({ per_page: 6 }),
                appointmentService.getUpcomingAppointments({ per_page: 5 }),
                healthReminderService.getDueSoonReminders(14),
                announcementService.getLatestAnnouncements(3),
            ]);
            setPets(petsRes.data ?? []);
            setUpcoming(apptRes.data ?? []);
            setReminders(reminderRes.data ?? []);
            setAnnouncements(annRes.data ?? []);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={LayoutDashboard} title="Welcome Back" subtitle="Here's what's happening with your pets" onRefresh={fetchData} />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard icon={PawPrint} label="My Pets" value={loading ? '—' : pets.length} color={C.sky} />
                        <StatCard icon={CalendarClock} label="Upcoming Visits" value={loading ? '—' : upcoming.length} color={C.navy} />
                        <StatCard icon={HeartPulse} label="Reminders Due" value={loading ? '—' : reminders.length} color={C.amber} />
                        <Link href="/owner/appointments/emergency"
                            className="rounded-2xl p-4 flex items-center gap-3 text-white shadow-sm" style={{ background: C.red }}>
                            <Siren className="w-6 h-6" />
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide opacity-90">Need help now?</p>
                                <p className="text-sm font-black">Emergency Booking</p>
                            </div>
                        </Link>
                    </div>

                    {/* My Pets */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <p className="text-sm font-black text-gray-800">My Pets</p>
                            <Link href="/owner/pets" className="text-xs font-bold flex items-center gap-0.5" style={{ color: C.sky }}>View all <ChevronRight className="w-3 h-3" /></Link>
                        </div>
                        {loading ? (
                            <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
                        ) : pets.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-sm text-gray-400 mb-3">You haven't added any pets yet.</p>
                                <Link href="/owner/pets/create" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold" style={{ background: C.sky }}>
                                    <Plus className="w-3.5 h-3.5" /> Add Your First Pet
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5">
                                {pets.map(p => (
                                    <Link key={p.id} href={`/owner/pets/${p.id}`} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <PetAvatar photoUrl={p.photo_url} size="lg" />
                                        <p className="text-xs font-bold text-gray-700 truncate max-w-full">{p.name}</p>
                                    </Link>
                                ))}
                                <Link href="/owner/pets/create" className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-sky-300 transition-colors">
                                    <Plus className="w-5 h-5 text-gray-300" />
                                    <p className="text-xs font-bold text-gray-400">Add Pet</p>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Upcoming Appointments */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <p className="text-sm font-black text-gray-800">Upcoming Appointments</p>
                            <Link href="/owner/appointments" className="text-xs font-bold flex items-center gap-0.5" style={{ color: C.sky }}>View all <ChevronRight className="w-3 h-3" /></Link>
                        </div>
                        {loading ? (
                            <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
                        ) : upcoming.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-sm text-gray-400 mb-3">No upcoming appointments.</p>
                                <Link href="/owner/appointments/create" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold" style={{ background: C.sky }}>
                                    <Plus className="w-3.5 h-3.5" /> Book an Appointment
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {upcoming.map(a => (
                                    <Link key={a.id} href={`/owner/appointments/${a.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                                        <PetAvatar photoUrl={a.pet?.photo_url} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-800 truncate">{a.pet?.name}</p>
                                            <p className="text-xs text-gray-400">{formatPHDateTime(`${a.appointment_date}T${a.appointment_time}`)}</p>
                                        </div>
                                        <span className="text-[11px] font-bold text-gray-500 capitalize">{a.status_label ?? a.status}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Health Reminders + Announcements */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <p className="text-sm font-black text-gray-800">Health Reminders</p>
                                <Link href="/owner/health-reminders" className="text-xs font-bold" style={{ color: C.sky }}>View all</Link>
                            </div>
                            {reminders.length === 0 ? (
                                <p className="p-6 text-center text-sm text-gray-400">Nothing due soon.</p>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {reminders.slice(0, 4).map(r => (
                                        <div key={r.id} className="px-5 py-3">
                                            <p className="text-sm font-semibold text-gray-700">{r.title}</p>
                                            <p className="text-xs text-gray-400">{r.pet?.name} · due {r.due_date}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <p className="text-sm font-black text-gray-800 flex items-center gap-1.5"><Megaphone className="w-4 h-4 text-gray-400" /> Announcements</p>
                                <Link href="/owner/announcements" className="text-xs font-bold" style={{ color: C.sky }}>View all</Link>
                            </div>
                            {announcements.length === 0 ? (
                                <p className="p-6 text-center text-sm text-gray-400">No announcements right now.</p>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {announcements.map(a => (
                                        <Link key={a.id} href={`/owner/announcements/${a.id}`} className="block px-5 py-3 hover:bg-gray-50 transition-colors">
                                            <p className="text-sm font-semibold text-gray-700 truncate">{a.title}</p>
                                            <p className="text-xs text-gray-400 line-clamp-1">{a.excerpt}</p>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
