// resources/js/pages/Owner/Pets/Create.tsx
import { Head, router } from '@inertiajs/react';
import { useRef, useState, useMemo } from 'react';
import { PawPrint, Save, Camera, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { petService } from '@/services';
import type { MedicalRecordEntry } from '@/services/PetService';
import { PageHeader, BackLink, toastSuccess, toastError, C } from '@/pages/Owner/_shared/OwnerUI';
import SearchableSelect from '@/components/SearchableSelect';
import { SPECIES_OPTIONS, DOG_BREEDS, CAT_BREEDS } from '@/data/breeds';

const BREEDS_BY_SPECIES: Record<string, string[]> = {
    Dog: DOG_BREEDS,
    Cat: CAT_BREEDS,
};

const SERVICE_OPTIONS = [
    'Vaccination', 'Deworming', 'Checkup', 'Grooming', 'Surgery',
    'Consultation', 'Lab Test', 'X-Ray', 'Ultrasound', 'Dental', 'Other',
];

const emptyRecord = (): MedicalRecordEntry => ({ visit_date: '', service: '', follow_up_date: '' });

export default function PetCreate() {
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [photo, setPhoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [showRecords, setShowRecords] = useState(false);
    const [records, setRecords] = useState<MedicalRecordEntry[]>([]);

    const [form, setForm] = useState({
        name: '', species: '', breed: '', sex: 'unknown' as 'male' | 'female' | 'unknown',
        birth_date: '', weight_kg: '', color: '',
        allergies: '', notes: '',
    });

    const breedOptions = useMemo(() => {
        return form.species ? (BREEDS_BY_SPECIES[form.species] ?? []) : [];
    }, [form.species]);

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

        const res = await petService.createPet({
            ...form,
            weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
            birth_date: form.birth_date || undefined,
            photo: photo ?? undefined,
            medical_records: records.filter(r => r.visit_date && r.service),
        });
        setSaving(false);
        if (res.success && res.data) {
            toastSuccess(`${res.data.name} has been added!`);
            router.visit(`/owner/pets/${res.data.id}`);
        } else {
            setErrors(res.errors ?? {});
            toastError(res.message ?? 'Failed to register pet.');
        }
    };

    return (
        <AppLayout>
            <Head title="Add Pet" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={PawPrint} title="Add a New Pet" />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <BackLink href="/owner/pets" label="Back to My Pets" />

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => fileRef.current?.click()}
                                className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden hover:border-sky-300 transition-colors">
                                {preview ? <img src={preview} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-gray-300" />}
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => onPickPhoto(e.target.files?.[0])} />
                            <p className="text-xs text-gray-400">Add a photo of your pet (optional)</p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Pet Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} error={errors.name} required />
                            <SearchableSelect
                                label="Species"
                                value={form.species}
                                options={SPECIES_OPTIONS}
                                onChange={onSpeciesChange}
                                error={errors.species}
                                placeholder="Select species…"
                                required
                            />
                            <SearchableSelect
                                label="Breed"
                                value={form.breed}
                                options={breedOptions}
                                onChange={v => setForm(f => ({ ...f, breed: v }))}
                                error={errors.breed}
                                placeholder={form.species ? 'Select breed…' : 'Select species first…'}
                                required
                            />
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
                                    {records.length === 0 && (
                                        <p className="text-xs text-gray-400 text-center py-2">No records yet. Add one below.</p>
                                    )}

                                    {records.map((rec, idx) => (
                                        <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100">
                                            <div className="flex-1 grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Date *</label>
                                                    <input type="date" value={rec.visit_date}
                                                        onChange={e => {
                                                            const next = [...records];
                                                            next[idx].visit_date = e.target.value;
                                                            setRecords(next);
                                                        }}
                                                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-sky-200" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Service *</label>
                                                    <select value={rec.service}
                                                        onChange={e => {
                                                            const next = [...records];
                                                            next[idx].service = e.target.value;
                                                            setRecords(next);
                                                        }}
                                                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-sky-200">
                                                        <option value="">Select…</option>
                                                        {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Next Date</label>
                                                    <input type="date" value={rec.follow_up_date ?? ''}
                                                        onChange={e => {
                                                            const next = [...records];
                                                            next[idx].follow_up_date = e.target.value;
                                                            setRecords(next);
                                                        }}
                                                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-sky-200" />
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => setRecords(records.filter((_, i) => i !== idx))}
                                                className="mt-4 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}

                                    <button type="button" onClick={() => setRecords([...records, emptyRecord()])}
                                        className="flex items-center gap-1.5 text-xs font-bold transition-colors"
                                        style={{ color: C.sky }}>
                                        <Plus className="w-3.5 h-3.5" /> Add Another Record
                                    </button>
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: C.sky }}>
                            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Add Pet'}
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

function Field({ label, value, onChange, error, type = 'text', placeholder, required }: {
    label: string; value: string; onChange: (v: string) => void; error?: string[]; type?: string; placeholder?: string; required?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
            <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-sky-200 focus:border-sky-300'}`} />
            {error && <p className="text-xs text-red-500 mt-1">{error[0]}</p>}
        </div>
    );
}
