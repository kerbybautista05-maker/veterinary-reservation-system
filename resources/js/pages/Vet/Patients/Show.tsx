// resources/js/pages/Vet/Patients/Show.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { PawPrint, Stethoscope, FilePlus, Paperclip, HeartPulse, X, Save, CheckCircle2, Eye, Pencil } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { petService, petMedicalRecordService, healthReminderService } from '@/services';
import type { Pet, PetMedicalRecord, HealthReminder, HealthReminderType } from '@/services';
import { PageHeader, BackLink, EmptyState, toastSuccess, toastError, C } from '@/pages/Vet/_shared/VetUI';
import { formatPHDate } from '@/pages/Shared/helpers';

const TYPES: { value: HealthReminderType; label: string }[] = [
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'deworming',   label: 'Deworming' },
    { value: 'checkup',     label: 'Checkup' },
    { value: 'medication',  label: 'Medication' },
    { value: 'grooming',    label: 'Grooming' },
    { value: 'other',       label: 'Other' },
];

const TEXT_FIELDS = ['diagnosis', 'symptoms', 'treatment', 'prescription', 'notes'] as const;

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200';

export default function VetPatientShow({ petId }: { petId: number | string }) {
    const [pet, setPet] = useState<Pet | null>(null);
    const [records, setRecords] = useState<PetMedicalRecord[]>([]);
    const [reminders, setReminders] = useState<HealthReminder[]>([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [form, setForm] = useState({
        type: 'vaccination' as HealthReminderType, title: '', description: '',
        due_date: '', is_recurring: false, recurrence_interval_days: '',
    });

    // ── Medical record view/edit modal ──
    const [selected, setSelected] = useState<PetMedicalRecord | null>(null);
    const [editing, setEditing] = useState(false);
    const [savingRecord, setSavingRecord] = useState(false);
    const [recForm, setRecForm] = useState({
        visit_date: '', service_type: '', follow_up_date: '',
        diagnosis: '', symptoms: '', treatment: '', prescription: '', notes: '',
    });

    const fetchReminders = useCallback(async () => {
        const res = await healthReminderService.getReminders({ pet_id: Number(petId), status: 'pending', per_page: 20 });
        if (res.success) setReminders(res.data ?? []);
    }, [petId]);

    const fetchRecords = useCallback(async () => {
        const rec = await petMedicalRecordService.getRecordsForPet(Number(petId));
        if (rec.success) setRecords(rec.data ?? []);
    }, [petId]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const res = await petService.getPet(Number(petId));
            if (res.success && res.data) {
                setPet(res.data);
                await fetchRecords();
                await fetchReminders();
            }
            setLoading(false);
        })();
    }, [petId, fetchReminders, fetchRecords]);

    const resetForm = () => setForm({ type: 'vaccination', title: '', description: '', due_date: '', is_recurring: false, recurrence_interval_days: '' });

    const submitReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        if (!form.title.trim()) { setErrors({ title: ['Title is required.'] }); return; }
        if (!form.due_date) { setErrors({ due_date: ['Due date is required.'] }); return; }

        setSaving(true);
        const res = await healthReminderService.createReminder({
            pet_id: Number(petId),
            type: form.type,
            title: form.title,
            description: form.description || undefined,
            due_date: form.due_date,
            is_recurring: form.is_recurring,
            recurrence_interval_days: form.is_recurring && form.recurrence_interval_days ? Number(form.recurrence_interval_days) : undefined,
        });
        setSaving(false);

        if (res.success) {
            toastSuccess('Reminder added for this patient.');
            resetForm();
            setShowForm(false);
            fetchReminders();
        } else {
            setErrors(res.errors ?? {});
            toastError(res.message ?? 'Failed to add reminder.');
        }
    };

    const completeReminder = async (id: number) => {
        const res = await healthReminderService.completeReminder(id);
        if (res.success) { toastSuccess('Marked complete.'); fetchReminders(); }
    };

    const openRecord = (r: PetMedicalRecord) => {
        const x = r as any;
        setSelected(r);
        setEditing(false);
        setRecForm({
            visit_date: (r.visit_date ?? '').toString().slice(0, 10),
            service_type: x.service_type ?? '',
            follow_up_date: (x.follow_up_date ?? '').toString().slice(0, 10),
            diagnosis: r.diagnosis ?? '',
            symptoms: r.symptoms ?? '',
            treatment: r.treatment ?? '',
            prescription: r.prescription ?? '',
            notes: x.notes ?? '',
        });
    };

    const closeRecord = () => { setSelected(null); setEditing(false); };

    const saveRecord = async () => {
        if (!selected) return;
        setSavingRecord(true);
        const res = await petMedicalRecordService.updateRecord(selected.id, {
            ...recForm,
            service_type: recForm.service_type || null,
            follow_up_date: recForm.follow_up_date || null,
        });
        setSavingRecord(false);

        if (res.success) {
            toastSuccess('Medical record updated.');
            await fetchRecords();
            closeRecord();
        } else {
            toastError(res.message ?? 'Failed to update record.');
        }
    };

    if (loading) return <AppLayout><Head title="Patient" /><div className="p-10 text-center text-sm text-gray-400">Loading…</div></AppLayout>;
    if (!pet) return <AppLayout><Head title="Patient" /><div className="p-10 text-center text-sm text-gray-400">Patient not found.</div></AppLayout>;

    const sel = selected as any;

    return (
        <AppLayout>
            <Head title={pet.name} />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={PawPrint} title={pet.name} subtitle="Patient record" />

                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <BackLink href="/vet/patients" label="Back to Patients" />

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <h2 className="text-lg font-black text-gray-800">{pet.name}</h2>
                                <p className="text-sm text-gray-500">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''} · {pet.sex}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Owner: {pet.owner?.full_name ?? pet.owner?.name} ({pet.owner?.email})</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowForm(v => !v)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors">
                                    {showForm ? <><X className="w-3.5 h-3.5" /> Close</> : <><HeartPulse className="w-3.5 h-3.5" /> Add Reminder</>}
                                </button>
                                <Link href={`/vet/patients/${pet.id}/records/create`}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold" style={{ background: C.blue }}>
                                    <FilePlus className="w-3.5 h-3.5" /> New Record
                                </Link>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4 mt-6 text-sm">
                            {pet.age_label && <div><p className="text-xs text-gray-400 font-bold uppercase">Age</p><p className="text-gray-700">{pet.age_label}</p></div>}
                            {pet.weight_kg && <div><p className="text-xs text-gray-400 font-bold uppercase">Weight</p><p className="text-gray-700">{pet.weight_kg} kg</p></div>}
                            {pet.microchip_id && <div><p className="text-xs text-gray-400 font-bold uppercase">Microchip</p><p className="text-gray-700">{pet.microchip_id}</p></div>}
                        </div>
                        {pet.allergies && <p className="text-sm text-red-600 mt-4 font-semibold">⚠ Allergies: {pet.allergies}</p>}
                        {pet.notes && <p className="text-sm text-gray-600 mt-2">{pet.notes}</p>}
                    </div>

                    {showForm && (
                        <form onSubmit={submitReminder} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                            <p className="text-sm font-black text-gray-800">New Health Reminder for {pet.name}</p>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Type</label>
                                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as HealthReminderType }))}
                                        className={inputCls}>
                                        {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Due Date</label>
                                    <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                                        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.due_date ? 'border-red-300' : 'border-gray-200 focus:ring-blue-200'}`} />
                                    {errors.due_date && <p className="text-xs text-red-500 mt-1">{errors.due_date[0]}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Title</label>
                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="e.g. Rabies booster due"
                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.title ? 'border-red-300' : 'border-gray-200 focus:ring-blue-200'}`} />
                                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title[0]}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Notes <span className="text-gray-300 font-medium">(optional)</span></label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                                    className={inputCls} />
                            </div>

                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <input type="checkbox" checked={form.is_recurring} onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))} className="rounded" />
                                Repeats
                            </label>
                            {form.is_recurring && (
                                <input type="number" min="1" value={form.recurrence_interval_days}
                                    onChange={e => setForm(f => ({ ...f, recurrence_interval_days: e.target.value }))}
                                    placeholder="Repeat every N days (e.g. 365)"
                                    className={inputCls} />
                            )}

                            <button type="submit" disabled={saving}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: C.blue }}>
                                <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Add Reminder'}
                            </button>
                        </form>
                    )}

                    {reminders.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                                <HeartPulse className="w-4 h-4 text-gray-400" />
                                <p className="text-sm font-black text-gray-800">Pending Reminders</p>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {reminders.map(r => (
                                    <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-gray-700">{r.title}</p>
                                            <p className="text-xs text-gray-400">Due {formatPHDate(r.due_date)}{r.is_overdue ? ' · Overdue' : ''}</p>
                                        </div>
                                        <button onClick={() => completeReminder(r.id)} className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 shrink-0">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Done
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-gray-400" />
                            <p className="text-sm font-black text-gray-800">Medical History</p>
                        </div>
                        {records.length === 0 ? (
                            <EmptyState icon={Stethoscope} title="No medical records yet" />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {records.map(r => (
                                    <div key={r.id} onClick={() => openRecord(r)} className="px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-gray-800">{r.diagnosis ?? 'Visit'}</p>
                                            <span className="text-xs text-gray-400">{formatPHDate(r.visit_date)}</span>
                                        </div>
                                        {r.symptoms && <p className="text-xs text-gray-500 mt-1"><span className="font-bold">Symptoms:</span> {r.symptoms}</p>}
                                        {r.treatment && <p className="text-xs text-gray-500 mt-1"><span className="font-bold">Treatment:</span> {r.treatment}</p>}
                                        {r.prescription && <p className="text-xs text-gray-500 mt-1"><span className="font-bold">Prescription:</span> {r.prescription}</p>}
                                        {r.attachments && r.attachments.length > 0 && (
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Paperclip className="w-3 h-3" /> {r.attachments.length} attachment(s)</p>
                                        )}
                                        <p className="text-[11px] text-gray-400 mt-2">Dr. {r.veterinarian?.full_name ?? r.veterinarian?.name}</p>
                                        <span className="inline-flex items-center gap-1 text-xs font-bold mt-2" style={{ color: C.blue }}>
                                            <Eye className="w-3.5 h-3.5" /> View / Edit
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeRecord}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
                            <p className="text-sm font-black text-gray-800">Medical Record Details</p>
                            <div className="flex items-center gap-2">
                                {!editing && (
                                    <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                    </button>
                                )}
                                <button onClick={closeRecord} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="p-5 space-y-4 text-sm">
                            {!editing ? (
                                <>
                                    <div><p className="text-[11px] font-bold text-gray-400 uppercase">Date</p><p className="text-gray-700">{formatPHDate(selected.visit_date)}</p></div>
                                    <div><p className="text-[11px] font-bold text-gray-400 uppercase">Service Type</p><p className="text-gray-700">{sel.service_type || '—'}</p></div>
                                    <div><p className="text-[11px] font-bold text-gray-400 uppercase">Follow-up Date</p><p className="text-gray-700">{sel.follow_up_date ? formatPHDate(sel.follow_up_date) : '—'}</p></div>
                                    <div><p className="text-[11px] font-bold text-gray-400 uppercase">Diagnosis</p><p className="text-gray-700">{selected.diagnosis || '—'}</p></div>
                                    <div><p className="text-[11px] font-bold text-gray-400 uppercase">Symptoms</p><p className="text-gray-700">{selected.symptoms || '—'}</p></div>
                                    <div><p className="text-[11px] font-bold text-gray-400 uppercase">Treatment</p><p className="text-gray-700">{selected.treatment || '—'}</p></div>
                                    <div><p className="text-[11px] font-bold text-gray-400 uppercase">Prescription</p><p className="text-gray-700">{selected.prescription || '—'}</p></div>
                                    <div><p className="text-[11px] font-bold text-gray-400 uppercase">Notes</p><p className="text-gray-700">{sel.notes || '—'}</p></div>
                                    <div><p className="text-[11px] font-bold text-gray-400 uppercase">Veterinarian</p><p className="text-gray-700">{selected.veterinarian?.full_name ?? selected.veterinarian?.name}</p></div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Visit Date</label>
                                        <input type="date" value={recForm.visit_date} onChange={e => setRecForm(f => ({ ...f, visit_date: e.target.value }))} className={inputCls} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Service Type</label>
                                        <input value={recForm.service_type} onChange={e => setRecForm(f => ({ ...f, service_type: e.target.value }))} className={inputCls} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Follow-up Date</label>
                                        <input type="date" value={recForm.follow_up_date} onChange={e => setRecForm(f => ({ ...f, follow_up_date: e.target.value }))} className={inputCls} />
                                    </div>
                                    {TEXT_FIELDS.map(k => (
                                        <div key={k}>
                                            <label className="block text-xs font-bold text-gray-500 mb-1.5 capitalize">{k}</label>
                                            <textarea rows={2} value={recForm[k]} onChange={e => setRecForm(f => ({ ...f, [k]: e.target.value }))} className={inputCls} />
                                        </div>
                                    ))}
                                    <div className="flex gap-2 pt-1">
                                        <button onClick={saveRecord} disabled={savingRecord}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: C.blue }}>
                                            <Save className="w-4 h-4" /> {savingRecord ? 'Saving…' : 'Save Changes'}
                                        </button>
                                        <button onClick={() => setEditing(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">Cancel</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}