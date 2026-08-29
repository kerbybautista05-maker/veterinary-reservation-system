// resources/js/pages/Vet/Appointments/Show.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { CalendarClock, PawPrint, User as UserIcon, Check, XCircle, RotateCcw, CheckCircle2, FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { appointmentService } from '@/services';
import type { Appointment } from '@/services';
import { PageHeader, BackLink, StatusPill, confirmAction, toastSuccess, toastError, C } from '@/pages/Vet/_shared/VetUI';
import { formatPHDateTime } from '@/pages/Shared/helpers';

export default function VetAppointmentShow({ appointmentId }: { appointmentId: number | string }) {
    const [appt, setAppt] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const fetchData = useCallback(async () => {
        const res = await appointmentService.getAppointment(Number(appointmentId));
        if (res.success) setAppt(res.data ?? null);
        setLoading(false);
    }, [appointmentId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const runAction = async (label: string, fn: () => Promise<any>) => {
        const ok = await confirmAction({ title: label });
        if (!ok) return;
        setBusy(true);
        const res = await fn();
        setBusy(false);
        if (res.success) { toastSuccess('Appointment updated.'); fetchData(); }
        else toastError(res.message ?? 'Action failed.');
    };

    if (loading) return <AppLayout><Head title="Appointment" /><div className="p-10 text-center text-sm text-gray-400">Loading…</div></AppLayout>;
    if (!appt) return <AppLayout><Head title="Appointment" /><div className="p-10 text-center text-sm text-gray-400">Appointment not found.</div></AppLayout>;

    return (
        <AppLayout>
            <Head title={`Appointment #${appt.id}`} />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={CalendarClock} title={`Appointment #${appt.id}`} />

                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <BackLink href="/vet/appointments" label="Back to Appointments" />

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <StatusPill label={appt.status_label ?? appt.status} color={appt.status_color} />
                            {appt.is_emergency && <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-full">EMERGENCY</span>}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 mt-5 text-sm">
                            <Link href={`/vet/patients/${appt.pet_id}`} className="flex items-center gap-2 hover:underline" style={{ color: C.blue }}>
                                <PawPrint className="w-4 h-4" />{appt.pet?.name ?? 'Pet'} ({appt.pet?.species})
                            </Link>
                            <div className="flex items-center gap-2 text-gray-600"><UserIcon className="w-4 h-4 text-gray-400" />{appt.owner?.full_name ?? appt.owner?.name}</div>
                            <div className="flex items-center gap-2 text-gray-600"><CalendarClock className="w-4 h-4 text-gray-400" />{formatPHDateTime(`${appt.appointment_date}T${appt.appointment_time}`)}</div>
                        </div>
                        {appt.service_type && <p className="text-sm text-gray-600 mt-3"><span className="font-bold">Service:</span> {appt.service_type}</p>}
                        {appt.reason && <p className="text-sm text-gray-600 mt-1"><span className="font-bold">Reason:</span> {appt.reason}</p>}
                        {appt.cancellation_reason && <p className="text-sm text-red-600 mt-1"><span className="font-bold">Cancellation reason:</span> {appt.cancellation_reason}</p>}

                        <div className="flex items-center gap-2 mt-5 flex-wrap">
                            {appt.status === 'pending' && (
                                <ActionButton icon={Check} label="Confirm" color={C.green} busy={busy}
                                    onClick={() => runAction('Confirm this appointment?', () => appointmentService.confirmAppointment(appt.id))} />
                            )}
                            {(appt.status === 'confirmed' || appt.status === 'in_progress') && (
                                <ActionButton icon={CheckCircle2} label="Mark Completed" color={C.blue} busy={busy}
                                    onClick={() => runAction('Mark this appointment as completed?', () => appointmentService.completeAppointment(appt.id))} />
                            )}
                            {['pending', 'confirmed'].includes(appt.status) && (
                                <>
                                    <ActionButton icon={XCircle} label="Cancel" color={C.red} busy={busy}
                                        onClick={() => runAction('Cancel this appointment?', () => appointmentService.cancelAppointment(appt.id))} />
                                    <ActionButton icon={RotateCcw} label="No-show" color={C.amber} busy={busy}
                                        onClick={() => runAction('Mark pet owner as no-show?', () => appointmentService.markNoShow(appt.id))} />
                                </>
                            )}
                            {appt.status === 'completed' && !appt.medical_record && (
                                <Link href={`/vet/patients/${appt.pet_id}/records/create?appointment_id=${appt.id}`}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ background: C.navy }}>
                                    <FileText className="w-3.5 h-3.5" /> Write Medical Record
                                </Link>
                            )}
                        </div>
                    </div>

                    {appt.status_logs && appt.status_logs.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100"><p className="text-sm font-black text-gray-800">Status History</p></div>
                            <div className="divide-y divide-gray-50">
                                {appt.status_logs.map(l => (
                                    <div key={l.id} className="px-5 py-3 flex items-center justify-between">
                                        <span className="text-sm text-gray-700 font-medium">{l.transition_label ?? `${l.from_status ?? 'New'} → ${l.to_status}`}</span>
                                        <span className="text-xs text-gray-400">{formatPHDateTime(l.created_at)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function ActionButton({ icon: Icon, label, color, onClick, busy }: {
    icon: React.ElementType; label: string; color: string; onClick: () => void; busy: boolean;
}) {
    return (
        <button onClick={onClick} disabled={busy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-opacity"
            style={{ background: color }}>
            <Icon className="w-3.5 h-3.5" /> {label}
        </button>
    );
}
