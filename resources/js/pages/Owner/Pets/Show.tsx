// resources/js/pages/Owner/Pets/Show.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { PawPrint, Stethoscope, HeartPulse, Pencil, CalendarPlus, CheckCircle2, X, Eye } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { petService, petMedicalRecordService, healthReminderService } from '@/services';
import type { Pet, PetMedicalRecord, HealthReminder } from '@/services';
import { PageHeader, BackLink, PetAvatar, EmptyState, toastSuccess, C } from '@/pages/Owner/_shared/OwnerUI';
import { formatPHDate } from '@/pages/Shared/helpers';

export default function PetShow({ petId }: { petId: number | string }) {
    const [pet, setPet] = useState<Pet | null>(null);
    const [records, setRecords] = useState<PetMedicalRecord[]>([]);
    const [reminders, setReminders] = useState<HealthReminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewRecord, setViewRecord] = useState<PetMedicalRecord | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const res = await petService.getPet(Number(petId));
        if (res.success && res.data) {
            setPet(res.data);
            const [rec, rem] = await Promise.all([
                petMedicalRecordService.getRecordsForPet(Number(petId)),
                healthReminderService.getReminders({ pet_id: Number(petId), status: 'pending' }),
            ]);
            if (rec.success) setRecords(rec.data ?? []);
            if (rem.success) setReminders(rem.data ?? []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [petId]);

    const completeReminder = async (id: number) => {
        const res = await healthReminderService.completeReminder(id);
        if (res.success) { toastSuccess('Marked complete.'); fetchData(); }
    };

    if (loading) return <AppLayout><Head title="Pet" /><div className="p-10 text-center text-sm text-gray-400">Loading…</div></AppLayout>;
    if (!pet) return <AppLayout><Head title="Pet" /><div className="p-10 text-center text-sm text-gray-400">Pet not found.</div></AppLayout>;

    return (
        <AppLayout>
            <Head title={pet.name} />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={PawPrint} title={pet.name} />

                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <BackLink href="/owner/pets" label="Back to My Pets" />

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-4">
                                <PetAvatar photoUrl={pet.photo_url} size="lg" />
                                <div>
                                    <h2 className="text-lg font-black text-gray-800">{pet.name}</h2>
                                    <p className="text-sm text-gray-500">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''} · {pet.sex}</p>
                                    {pet.age_label && <p className="text-xs text-gray-400 mt-0.5">{pet.age_label} old</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={`/owner/appointments/create?pet_id=${pet.id}`} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold" style={{ background: C.sky }}>
                                    <CalendarPlus className="w-3.5 h-3.5" /> Book Visit
                                </Link>
                                <Link href={`/owner/pets/${pet.id}/edit`} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                                    <Pencil className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4 mt-6 text-sm">
                            {pet.weight_kg && <div><p className="text-xs text-gray-400 font-bold uppercase">Weight</p><p className="text-gray-700">{pet.weight_kg} kg</p></div>}
                            {pet.color && <div><p className="text-xs text-gray-400 font-bold uppercase">Color</p><p className="text-gray-700">{pet.color}</p></div>}
                            {pet.microchip_id && <div><p className="text-xs text-gray-400 font-bold uppercase">Microchip</p><p className="text-gray-700">{pet.microchip_id}</p></div>}
                        </div>
                        {pet.allergies && <p className="text-sm text-red-600 mt-4"><span className="font-bold">Allergies:</span> {pet.allergies}</p>}
                        {pet.notes && <p className="text-sm text-gray-600 mt-2">{pet.notes}</p>}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                            <HeartPulse className="w-4 h-4 text-gray-400" />
                            <p className="text-sm font-black text-gray-800">Health Reminders</p>
                        </div>
                        {reminders.length === 0 ? (
                            <p className="p-6 text-center text-sm text-gray-400">No pending reminders.</p>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {reminders.map(r => (
                                    <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-gray-700">{r.title}</p>
                                            <p className="text-xs text-gray-400">Due {formatPHDate(r.due_date)}{r.is_overdue ? ' · Overdue' : ''}</p>
                                        </div>
                                        <button onClick={() => completeReminder(r.id)} className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Done
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-gray-400" />
                            <p className="text-sm font-black text-gray-800">Medical History</p>
                        </div>
                        {records.length === 0 ? (
                            <EmptyState icon={Stethoscope} title="No medical records yet" />
                        ) : (
                            <div>
                                <div className="hidden sm:grid grid-cols-4 gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    <span>Date</span>
                                    <span>Service</span>
                                    <span>Next Date</span>
                                    <span className="text-right">Action</span>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {records.map(r => (
                                        <div key={r.id} className="px-5 py-3 grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-4 items-center">
                                            <div>
                                                <span className="sm:hidden text-[10px] font-bold text-gray-400 uppercase">Date</span>
                                                <p className="text-sm font-bold text-gray-800">{formatPHDate(r.visit_date)}</p>
                                            </div>
                                            <div>
                                                <span className="sm:hidden text-[10px] font-bold text-gray-400 uppercase">Service</span>
                                                <p className="text-sm text-gray-700">{r.service_type ?? '—'}</p>
                                            </div>
                                            <div>
                                                <span className="sm:hidden text-[10px] font-bold text-gray-400 uppercase">Next Date</span>
                                                <p className="text-sm text-gray-700">{r.follow_up_date ? formatPHDate(r.follow_up_date) : '—'}</p>
                                            </div>
                                            <div className="sm:text-right">
                                                <button onClick={() => setViewRecord(r)}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700">
                                                    <Eye className="w-3.5 h-3.5" /> View
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── View Record Modal ──────────────────────────────────── */}
                    {viewRecord && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setViewRecord(null)}>
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                    <p className="text-sm font-black text-gray-800">Medical Record Details</p>
                                    <button onClick={() => setViewRecord(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="p-5 space-y-4 text-sm">
                                    <Row label="Date" value={formatPHDate(viewRecord.visit_date)} />
                                    <Row label="Service Type" value={viewRecord.service_type} />
                                    <Row label="Weight" value={viewRecord.weight_kg ? `${viewRecord.weight_kg} kg` : null} />
                                    <Row label="Temperature" value={viewRecord.temperature_c ? `${viewRecord.temperature_c} °C` : null} />
                                    <Row label="Symptoms" value={viewRecord.symptoms} />
                                    <Row label="Diagnosis" value={viewRecord.diagnosis} />
                                    <Row label="Treatment" value={viewRecord.treatment} />
                                    <Row label="Prescription" value={viewRecord.prescription} />
                                    <Row label="Lab Results" value={viewRecord.lab_results} />
                                    <Row label="Notes" value={viewRecord.notes} />
                                    <Row label="Follow-up Date" value={viewRecord.follow_up_date ? formatPHDate(viewRecord.follow_up_date) : null} />
                                    {viewRecord.veterinarian && (
                                        <Row label="Veterinarian" value={viewRecord.veterinarian.full_name ?? viewRecord.veterinarian.name} />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase">{label}</p>
            <p className="text-sm text-gray-700 mt-0.5">{value}</p>
        </div>
    );
}
