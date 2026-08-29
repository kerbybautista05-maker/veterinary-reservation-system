// resources/js/pages/Owner/Appointments/Show.tsx
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { CalendarClock, PawPrint, Stethoscope, XCircle, CalendarSync, Star, Wallet } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { appointmentService } from '@/services';
import type { Appointment } from '@/services';
import { PageHeader, BackLink, StatusPill, PetAvatar, confirmAction, toastSuccess, toastError, C } from '@/pages/Owner/_shared/OwnerUI';
import { formatPHDateTime } from '@/pages/Shared/helpers';

export default function OwnerAppointmentShow({ appointmentId }: { appointmentId: number | string }) {
    const [appt, setAppt] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [showReschedule, setShowReschedule] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [rescheduleError, setRescheduleError] = useState<string | null>(null);

    const fetchData = async () => {
        const res = await appointmentService.getAppointment(Number(appointmentId));
        if (res.success) setAppt(res.data ?? null);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [appointmentId]);

    const handleCancel = async () => {
        const ok = await confirmAction({ title: 'Cancel this appointment?', danger: true, confirmText: 'Cancel Appointment' });
        if (!ok || !appt) return;
        setBusy(true);
        const res = await appointmentService.cancelAppointment(appt.id);
        setBusy(false);
        if (res.success) { toastSuccess('Appointment cancelled.'); fetchData(); }
        else toastError(res.message ?? 'Failed to cancel.');
    };

    const handleReschedule = async () => {
        if (!appt || !newDate || !newTime) return;

        const isTodayReschedule = newDate === new Date().toISOString().slice(0, 10);
        if (isTodayReschedule) {
            const selected = new Date(`${newDate}T${newTime}:00`);
            if (selected <= new Date()) {
                setRescheduleError('Hindi puwedeng mag-book ng appointment sa oras na nakalipas na. Pumili ng ibang oras.');
                return;
            }
        }

        setRescheduleError(null);
        setBusy(true);
        const res = await appointmentService.rescheduleAppointment(appt.id, { appointment_date: newDate, appointment_time: newTime });
        setBusy(false);
        if (res.success && res.data) {
            toastSuccess('Appointment rescheduled.');
            router.visit(`/owner/appointments/${res.data.id}`);
        } else {
            toastError(res.message ?? 'Failed to reschedule.');
        }
    };

    if (loading) return <AppLayout><Head title="Appointment" /><div className="p-10 text-center text-sm text-gray-400">Loading…</div></AppLayout>;
    if (!appt) return <AppLayout><Head title="Appointment" /><div className="p-10 text-center text-sm text-gray-400">Appointment not found.</div></AppLayout>;

    const canModify = ['pending', 'confirmed'].includes(appt.status);
    const today = new Date().toISOString().slice(0, 10);

    return (
        <AppLayout>
            <Head title={`Appointment for ${appt.pet?.name}`} />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={CalendarClock} title="Appointment Details" />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <BackLink href="/owner/appointments" label="Back to Appointments" />

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <StatusPill label={appt.status_label ?? appt.status} color={appt.status_color} />
                            {appt.is_emergency && <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-full">EMERGENCY</span>}
                        </div>

                        <div className="flex items-center gap-3 mt-4">
                            <PetAvatar photoUrl={appt.pet?.photo_url} size="lg" />
                            <div>
                                <p className="text-lg font-black text-gray-800">{appt.pet?.name}</p>
                                <p className="text-sm text-gray-500">{appt.pet?.species}</p>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 mt-5 text-sm">
                            <div className="flex items-center gap-2 text-gray-600"><CalendarClock className="w-4 h-4 text-gray-400" />{formatPHDateTime(`${appt.appointment_date}T${appt.appointment_time}`)}</div>
                            <div className="flex items-center gap-2 text-gray-600"><Stethoscope className="w-4 h-4 text-gray-400" />{appt.veterinarian ? `Dr. ${appt.veterinarian.full_name ?? appt.veterinarian.name}` : 'To be assigned'}</div>
                        </div>
                        {appt.service_type && <p className="text-sm text-gray-600 mt-3"><span className="font-bold">Service:</span> {appt.service_type}</p>}
                        {appt.reason && <p className="text-sm text-gray-600 mt-1"><span className="font-bold">Reason:</span> {appt.reason}</p>}
                        {appt.cancellation_reason && <p className="text-sm text-red-600 mt-1"><span className="font-bold">Cancellation reason:</span> {appt.cancellation_reason}</p>}

                        {canModify && (
                            <div className="flex items-center gap-2 mt-5 flex-wrap">
                                <button onClick={() => setShowReschedule(v => !v)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ background: C.sky }}>
                                    <CalendarSync className="w-3.5 h-3.5" /> Reschedule
                                </button>
                                <button onClick={handleCancel} disabled={busy}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50" style={{ background: C.red }}>
                                    <XCircle className="w-3.5 h-3.5" /> Cancel
                                </button>
                            </div>
                        )}

                        {showReschedule && (
                            <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <input type="date" min={today} value={newDate} onChange={e => { setNewDate(e.target.value); setRescheduleError(null); }}
                                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                                    <input type="time" value={newTime}
                                        min={newDate === today ? (() => { const n = new Date(); const h = n.getHours(); const m = n.getMinutes(); const r = m <= 30 ? 30 : 0; const hr = m <= 30 ? h : h + 1; return `${String(hr).padStart(2,'0')}:${String(r).padStart(2,'0')}`; })() : '09:00'}
                                        onChange={e => { setNewTime(e.target.value); setRescheduleError(null); }}
                                        className={`px-3 py-2 rounded-lg border text-sm ${rescheduleError ? 'border-red-300' : 'border-gray-200'}`} />
                                </div>
                                {rescheduleError && <p className="text-xs text-red-500">{rescheduleError}</p>}
                                <button onClick={handleReschedule} disabled={busy || !newDate || !newTime}
                                    className="px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50" style={{ background: C.sky }}>
                                    Confirm New Time
                                </button>
                            </div>
                        )}

                        {['confirmed', 'completed'].includes(appt.status) && !appt.payment && (
                            <Link href={`/owner/payments/create?appointment_id=${appt.id}`}
                                className="flex items-center justify-center gap-2 mt-5 px-4 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: C.sky }}>
                                <Wallet className="w-4 h-4" /> Pay Now
                            </Link>
                        )}
                        {appt.payment && (
                            <Link href={`/owner/payments/${appt.payment.id}`}
                                className="flex items-center justify-center gap-2 mt-5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors">
                                <Wallet className="w-4 h-4" /> View Payment ({appt.payment.status_label ?? appt.payment.status})
                            </Link>
                        )}

                        {appt.status === 'completed' && !appt.feedback && (
                            <Link href={`/owner/feedback/create?appointment_id=${appt.id}`}
                                className="flex items-center justify-center gap-2 mt-3 px-4 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: C.amber }}>
                                <Star className="w-4 h-4" /> Leave Feedback
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
