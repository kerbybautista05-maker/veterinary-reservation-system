// resources/js/pages/Owner/HealthReminders.tsx
import { Head } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { HeartPulse, CheckCircle2, Plus, X, Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { healthReminderService, petService } from '@/services';
import type { HealthReminder, HealthReminderType, Pet } from '@/services';
import { PageHeader, PetAvatar, EmptyState, toastSuccess, toastError, C } from '@/pages/Owner/_shared/OwnerUI';
import { formatPHDate } from '@/pages/Shared/helpers';

type Filter = 'pending' | 'overdue' | 'completed';

const TYPES: { value: HealthReminderType; label: string }[] = [
    { value: 'vaccination', label: 'Vaccination' },
    { value: 'deworming',   label: 'Deworming' },
    { value: 'checkup',     label: 'Checkup' },
    { value: 'medication',  label: 'Medication' },
    { value: 'grooming',    label: 'Grooming' },
    { value: 'other',       label: 'Other' },
];

export default function OwnerHealthReminders() {
    const [filter, setFilter] = useState<Filter>('pending');
    const [reminders, setReminders] = useState<HealthReminder[]>([]);
    const [loading, setLoading] = useState(true);

    const [pets, setPets] = useState<Pet[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [form, setForm] = useState({
        pet_id: '', type: 'vaccination' as HealthReminderType, title: '', description: '',
        due_date: '', is_recurring: false, recurrence_interval_days: '',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await healthReminderService.getReminders({ status: filter, per_page: 50 });
        if (res.success) setReminders(res.data ?? []);
        setLoading(false);
    }, [filter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        (async () => {
            const res = await petService.getPets({ per_page: 50 });
            if (res.success) setPets(res.data ?? []);
        })();
    }, []);

    const complete = async (id: number) => {
        const res = await healthReminderService.completeReminder(id);
        if (res.success) { toastSuccess('Marked complete.'); fetchData(); }
    };

    const resetForm = () => setForm({ pet_id: '', type: 'vaccination', title: '', description: '', due_date: '', is_recurring: false, recurrence_interval_days: '' });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!form.pet_id) { setErrors({ pet_id: ['Select a pet.'] }); return; }
        if (!form.title.trim()) { setErrors({ title: ['Title is required.'] }); return; }
        if (!form.due_date) { setErrors({ due_date: ['Due date is required.'] }); return; }

        setSaving(true);
        const res = await healthReminderService.createReminder({
            pet_id: Number(form.pet_id),
            type: form.type,
            title: form.title,
            description: form.description || undefined,
            due_date: form.due_date,
            is_recurring: form.is_recurring,
            recurrence_interval_days: form.is_recurring && form.recurrence_interval_days ? Number(form.recurrence_interval_days) : undefined,
        });
        setSaving(false);

        if (res.success) {
            toastSuccess('Reminder added.');
            resetForm();
            setShowForm(false);
            setFilter('pending');
            fetchData();
        } else {
            setErrors(res.errors ?? {});
            toastError(res.message ?? 'Failed to add reminder.');
        }
    };

    return (
        <AppLayout>
            <Head title="Health Reminders" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={HeartPulse} title="Health Reminders" subtitle="Vaccinations, checkups & more"
                    action={
                        <button onClick={() => setShowForm(v => !v)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-sky-700 hover:bg-white/90 text-xs font-bold transition-all shadow-sm">
                            {showForm ? <><X className="w-3.5 h-3.5" /> Close</> : <><Plus className="w-3.5 h-3.5" /> Add Reminder</>}
                        </button>
                    }
                    onRefresh={fetchData}
                />

                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    {showForm && (
                        <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                            <p className="text-sm font-black text-gray-800">New Health Reminder</p>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Pet</label>
                                    <select value={form.pet_id} onChange={e => setForm(f => ({ ...f, pet_id: e.target.value }))}
                                        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.pet_id ? 'border-red-300' : 'border-gray-200 focus:ring-sky-200'}`}>
                                        <option value="">Select a pet…</option>
                                        {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
                                    </select>
                                    {errors.pet_id && <p className="text-xs text-red-500 mt-1">{errors.pet_id[0]}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Type</label>
                                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as HealthReminderType }))}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200">
                                        {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Title</label>
                                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="e.g. Rabies booster shot"
                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.title ? 'border-red-300' : 'border-gray-200 focus:ring-sky-200'}`} />
                                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title[0]}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Notes <span className="text-gray-300 font-medium">(optional)</span></label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Due Date</label>
                                    <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                                        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.due_date ? 'border-red-300' : 'border-gray-200 focus:ring-sky-200'}`} />
                                    {errors.due_date && <p className="text-xs text-red-500 mt-1">{errors.due_date[0]}</p>}
                                </div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 pb-2.5">
                                    <input type="checkbox" checked={form.is_recurring} onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))} className="rounded" />
                                    Repeats
                                </label>
                            </div>

                            {form.is_recurring && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Repeat every (days)</label>
                                    <input type="number" min="1" value={form.recurrence_interval_days}
                                        onChange={e => setForm(f => ({ ...f, recurrence_interval_days: e.target.value }))}
                                        placeholder="e.g. 365 for yearly, 30 for monthly"
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
                                </div>
                            )}

                            <button type="submit" disabled={saving}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: C.sky }}>
                                <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Add Reminder'}
                            </button>
                        </form>
                    )}

                    <div className="flex items-center gap-2">
                        {(['pending', 'overdue', 'completed'] as Filter[]).map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors capitalize ${
                                    filter === f ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-500 border-gray-200 hover:border-sky-300'
                                }`}>
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
                        ) : reminders.length === 0 ? (
                            <EmptyState icon={HeartPulse} title="Nothing here"
                                action={!showForm && <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold" style={{ background: C.sky }}><Plus className="w-3.5 h-3.5" /> Add a Reminder</button>} />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {reminders.map(r => (
                                    <div key={r.id} className="flex items-center gap-3 px-5 py-3.5">
                                        <PetAvatar photoUrl={r.pet?.photo_url} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-800 truncate">{r.title}</p>
                                            <p className="text-xs text-gray-400">{r.pet?.name} · Due {formatPHDate(r.due_date)}{r.is_overdue ? ' · Overdue' : ''}</p>
                                        </div>
                                        {filter !== 'completed' && (
                                            <button onClick={() => complete(r.id)} className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 shrink-0">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Done
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}