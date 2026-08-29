// resources/js/pages/Owner/Pets/Edit.tsx
import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { PawPrint, Save, Camera, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { petService, petMedicalRecordService } from '@/services';
import type { Pet } from '@/services';
import type { PetMedicalRecord } from '@/services/PetMedicalRecordService';
import { PageHeader, BackLink, toastSuccess, toastError, C } from '@/pages/Owner/_shared/OwnerUI';
import SearchableSelect from '@/components/SearchableSelect';
import { SPECIES_OPTIONS, DOG_BREEDS, CAT_BREEDS } from '@/data/breeds';
import Swal from 'sweetalert2';

const BREEDS_BY_SPECIES: Record<string, string[]> = {
    Dog: DOG_BREEDS,
    Cat: CAT_BREEDS,
};

const SERVICE_OPTIONS = [
    'Vaccination', 'Deworming', 'Checkup', 'Grooming', 'Surgery',
    'Consultation', 'Lab Test', 'X-Ray', 'Ultrasound', 'Dental', 'Other',
];

interface RecordRow {
    id?: number;
    visit_date: string;
    service: string;
    follow_up_date: string;
    isNew?: boolean;
    isDeleted?: boolean;
}

export default function PetEdit({ petId }: { petId: number | string }) {
    const [pet, setPet] = useState<Pet | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [photo, setPhoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [showRecords, setShowRecords] = useState(false);
    const [records, setRecords] = useState<RecordRow[]>([]);

    const [form, setForm] = useState({
        name: '', species: '', breed: '', sex: 'unknown' as 'male' | 'female' | 'unknown',
        birth_date: '', weight_kg: '', color: '',
        allergies: '', notes: '',
    });

    const breedOptions = useMemo(() => {
        return form.species ? (BREEDS_BY_SPECIES[form.species] ?? []) : [];
    }, [form.species]);

    useEffect(() => {
        (async () => {
            const res = await petService.getPet(Number(petId));
            if (res.success && res.data) {
                const p = res.data;
                setPet(p);
                setForm({
                    name: p.name, species: p.species, breed: p.breed ?? '', sex: p.sex,
                    birth_date: p.birth_date ?? '', weight_kg: p.weight_kg ?? '', color: p.color ?? '',
                    allergies: p.allergies ?? '', notes: p.notes ?? '',
                });
                setPreview(p.photo_url ?? null);
            }
            setLoading(false);
        })();
    }, [petId]);

    useEffect(() => {
        if (!pet) return;
        (async () => {
            const res = await petMedicalRecordService.getRecordsForPet(Number(petId), { per_page: 50 });
            if (res.success && res.data) {
                setRecords(res.data.map((r: PetMedicalRecord) => ({
                    id: r.id,
                    visit_date: r.visit_date ?? '',
                    service: r.treatment ?? '',
                    follow_up_date: r.follow_up_date ?? '',
                })));
            }
        })();
    }, [pet]);

    const onSpeciesChange = (val: string) => {
        setForm(f => ({ ...f, species: val, breed: '' }));
    };

    const onPickPhoto = (file?: File) => {
        if (!file) return;
        setPhoto(file);
        setPreview(URL.createObjectURL(file));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        const clientErrors: Record<string, string[]> = {};
        if (!form.name) clientErrors.name = ['Pet name is required.'];
        if (!form.species) clientErrors.species = ['Species is required.'];
        if (!form.breed) clientErrors.breed = ['Breed is required.'];
        if (!form.sex) clientErrors.sex = ['Sex is required.'];

        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            setSaving(false);
            return;
        }

        const res = await petService.updatePet(Number(petId), {
            ...form,
            weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
            photo: photo ?? undefined,
        });
        setSaving(false);
        if (res.success) {
            // Save medical records
            const active = records.filter(r => !r.isDeleted);
            for (const r of active) {
                if (r.isNew && r.visit_date && r.service) {
                    await petMedicalRecordService.createRecord(Number(petId), {
                        visit_date: r.visit_date,
                        treatment: r.service,
                        follow_up_date: r.follow_up_date || undefined,
                    });
                } else if (!r.isNew && r.id) {
                    await petMedicalRecordService.updateRecord(r.id, {
                        visit_date: r.visit_date,
                        treatment: r.service,
                        follow_up_date: r.follow_up_date || undefined,
                    });
                }
            }
            // Delete removed records
            for (const r of records) {
                if (r.isDeleted && r.id) {
                    await petMedicalRecordService.deleteRecord(r.id);
                }
            }

            toastSuccess('Pet updated.');
            router.visit(`/owner/pets/${petId}`);
        } else {
            setErrors(res.errors ?? {});
            toastError(res.message ?? 'Failed to update pet.');
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Delete Pet?',
            html: `Are you sure you want to delete <strong>${pet?.name}</strong>? This action cannot be undone and will also delete all associated records.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        const res = await petService.deletePet(Number(petId));
        if (res.success) {
            toastSuccess(`${pet?.name} has been deleted.`);
            router.visit('/owner/pets');
        } else {
            toastError(res.message ?? 'Failed to delete pet.');
        }
    };

    const updateRecord = (idx: number, field: keyof RecordRow, value: string) => {
        setRecords(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
    };

    const removeRecord = (idx: number) => {
        setRecords(prev => prev.map((r, i) => i === idx ? { ...r, isDeleted: true } : r));
    };

    const addRecord = () => {
        setRecords(prev => [...prev, { visit_date: '', service: '', follow_up_date: '', isNew: true }]);
    };

    const visibleRecords = records.filter(r => !r.isDeleted);

    if (loading) return <AppLayout><Head title="Edit Pet" /><div className="p-10 text-center text-sm text-gray-400">Loading…</div></AppLayout>;
    if (!pet) return <AppLayout><Head title="Edit Pet" /><div className="p-10 text-center text-sm text-gray-400">Pet not found.</div></AppLayout>;

    return (
        <AppLayout>
            <Head title={`Edit ${pet.name}`} />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={PawPrint} title={`Edit ${pet.name}`} />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <BackLink href={`/owner/pets/${petId}`} label="Back to Pet Profile" />

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => fileRef.current?.click()}
                                className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden hover:border-sky-300 transition-colors">
                                {preview ? <img src={preview} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-gray-300" />}
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => onPickPhoto(e.target.files?.[0])} />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Pet Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} error={errors.name} required />
                            <SearchableSelect label="Species" value={form.species} options={SPECIES_OPTIONS} onChange={onSpeciesChange} error={errors.species} placeholder="Select species…" required />
                            <SearchableSelect label="Breed" value={form.breed} options={breedOptions} onChange={v => setForm(f => ({ ...f, breed: v }))} error={errors.breed} placeholder={form.species ? 'Select breed…' : 'Select species first…'} required />
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Sex <span className="text-red-400">*</span></label>
                                <select value={form.sex} onChange={e => setForm(f => ({ ...f, sex: e.target.value as any }))}
                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.sex ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-sky-200'}`}>
                                    <option value="unknown">Unknown</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                                {errors.sex && <p className="text-xs text-red-500 mt-1">{errors.sex[0]}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Birth Date</label>
                                <input type="date" max={new Date().toISOString().slice(0, 10)} value={form.birth_date}
                                    onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 border-gray-200 focus:ring-sky-200 focus:border-sky-300" />
                            </div>
                            <Field label="Weight (kg)" type="number" value={form.weight_kg} onChange={v => setForm(f => ({ ...f, weight_kg: v }))} />
                            <Field label="Color" value={form.color} onChange={v => setForm(f => ({ ...f, color: v }))} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Allergies</label>
                            <textarea value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} rows={2}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Notes</label>
                            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
                        </div>

                        {/* ── Previous Medical Records ── */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <button type="button" onClick={() => setShowRecords(v => !v)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                                <span className="text-sm font-bold text-gray-700">Previous Medical Records</span>
                                {showRecords ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                            </button>

                            {showRecords && (
                                <div className="p-4 space-y-3">
                                    {visibleRecords.length === 0 && (
                                        <p className="text-xs text-gray-400 text-center py-2">No records yet. Add one below.</p>
                                    )}

                                    {records.map((rec, idx) => {
                                        if (rec.isDeleted) return null;
                                        return (
                                            <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
                                                <div className="flex-1 grid grid-cols-3 gap-2">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Date *</label>
                                                        <input type="date" value={rec.visit_date}
                                                            onChange={e => updateRecord(idx, 'visit_date', e.target.value)}
                                                            className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-sky-200" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Service *</label>
                                                        <select value={rec.service}
                                                            onChange={e => updateRecord(idx, 'service', e.target.value)}
                                                            className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-sky-200">
                                                            <option value="">Select…</option>
                                                            {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-400 mb-1">Next Date</label>
                                                        <input type="date" value={rec.follow_up_date}
                                                            onChange={e => updateRecord(idx, 'follow_up_date', e.target.value)}
                                                            className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-sky-200" />
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => removeRecord(idx)}
                                                    className="mt-4 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}

                                    <button type="button" onClick={addRecord}
                                        className="flex items-center gap-1.5 text-xs font-bold transition-colors"
                                        style={{ color: C.sky }}>
                                        <Plus className="w-3.5 h-3.5" /> Add Another Record
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ── Actions ── */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <button type="button" onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-colors hover:opacity-90"
                                style={{ background: '#DC2626' }}>
                                <Trash2 className="w-4 h-4" /> Delete Pet
                            </button>
                            <button type="submit" disabled={saving}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: C.sky }}>
                                <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

function Field({ label, value, onChange, error, type = 'text', required }: {
    label: string; value: string; onChange: (v: string) => void; error?: string[]; type?: string; required?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-sky-200 focus:border-sky-300'}`} />
            {error && <p className="text-xs text-red-500 mt-1">{error[0]}</p>}
        </div>
    );
}
