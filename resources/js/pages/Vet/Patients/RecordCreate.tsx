// resources/js/pages/Vet/Patients/RecordCreate.tsx
import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { FilePlus, Save, Paperclip, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { petService, petMedicalRecordService } from '@/services';
import type { Pet } from '@/services';
import { PageHeader, BackLink, toastSuccess, toastError, C } from '@/pages/Vet/_shared/VetUI';
import { formatFileSize } from '@/pages/Shared/helpers';

export default function PatientRecordCreate({ petId }: { petId: number | string }) {
    const initialApptId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('appointment_id') : null;

    const [pet, setPet] = useState<Pet | null>(null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        service_type: '',
        visit_date: new Date().toISOString().slice(0, 10),
        weight_kg: '', temperature_c: '', symptoms: '', diagnosis: '',
        treatment: '', prescription: '', lab_results: '', notes: '', follow_up_date: '',
    });

    useEffect(() => {
        (async () => {
            const res = await petService.getPet(Number(petId));
            if (res.success) setPet(res.data ?? null);
        })();
    }, [petId]);

    const addFiles = (files: FileList | null) => {
        if (!files) return;
        setAttachments(prev => [...prev, ...Array.from(files)]);
    };

    const removeFile = (idx: number) => setAttachments(prev => prev.filter((_, i) => i !== idx));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        const res = await petMedicalRecordService.createRecord(Number(petId), {
            ...form,
            appointment_id: initialApptId ? Number(initialApptId) : undefined,
            weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
            temperature_c: form.temperature_c ? Number(form.temperature_c) : undefined,
            follow_up_date: form.follow_up_date || undefined,
            attachments: attachments.length ? attachments : undefined,
        });
        setSaving(false);
        if (res.success) {
            toastSuccess('Medical record saved.');
            router.visit(`/vet/patients/${petId}`);
        } else {
            setErrors(res.errors ?? {});
            toastError(res.message ?? 'Failed to save medical record.');
        }
    };

    return (
        <AppLayout>
            <Head title="New Medical Record" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={FilePlus} title="New Medical Record" subtitle={pet ? `For ${pet.name}` : undefined} />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <BackLink href={`/vet/patients/${petId}`} label="Back to Patient" />

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Service Type</label>
                                <select value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300">
                                    <option value="">— Select —</option>
                                    {['Vaccine','Surgery','Grooming','Breeding','Bathing','Deworming','Ultrasound','ICG','2D Echo','Consultation'].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <Field label="Visit Date" type="date" value={form.visit_date} onChange={v => setForm(f => ({ ...f, visit_date: v }))} error={errors.visit_date} />
                            <Field label="Weight (kg)" type="number" value={form.weight_kg} onChange={v => setForm(f => ({ ...f, weight_kg: v }))} />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Temperature (°C)" type="number" value={form.temperature_c} onChange={v => setForm(f => ({ ...f, temperature_c: v }))} />
                        </div>

                        <TextArea label="Symptoms" value={form.symptoms} onChange={v => setForm(f => ({ ...f, symptoms: v }))} />
                        <TextArea label="Diagnosis" value={form.diagnosis} onChange={v => setForm(f => ({ ...f, diagnosis: v }))} />
                        <TextArea label="Treatment" value={form.treatment} onChange={v => setForm(f => ({ ...f, treatment: v }))} />
                        <TextArea label="Prescription" value={form.prescription} onChange={v => setForm(f => ({ ...f, prescription: v }))} />
                        <TextArea label="Lab Results" value={form.lab_results} onChange={v => setForm(f => ({ ...f, lab_results: v }))} />
                        <TextArea label="Notes" value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />

                        <Field label="Follow-up Date (optional)" type="date" value={form.follow_up_date} onChange={v => setForm(f => ({ ...f, follow_up_date: v }))} />

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Attachments</label>
                            <button type="button" onClick={() => fileRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors text-xs font-bold">
                                <Paperclip className="w-3.5 h-3.5" /> Add files
                            </button>
                            <input ref={fileRef} type="file" multiple hidden onChange={e => addFiles(e.target.files)} />
                            {attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {attachments.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-1.5">
                                            <span className="text-gray-600 truncate">{f.name} <span className="text-gray-400">({formatFileSize(f.size)})</span></span>
                                            <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: C.blue }}>
                            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Record'}
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

function Field({ label, value, onChange, error, type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void; error?: string[]; type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200 focus:border-blue-300'}`} />
            {error && <p className="text-xs text-red-500 mt-1">{error[0]}</p>}
        </div>
    );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">{label}</label>
            <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
    );
}
