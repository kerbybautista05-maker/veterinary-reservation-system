// resources/js/pages/Admin/Veterinarians/Create.tsx
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Stethoscope, Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { userService } from '../../../services';
import { PageHeader, BackLink, toastSuccess, toastError, C } from '../_shared/AdminUI';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function VeterinarianCreate() {
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [form, setForm] = useState({
        first_name: '', last_name: '', middle_name: '', suffix: '',
        email: '', phone_number: '', address: '',
        password: '', password_confirmation: '',
        license_number: '', specialization: '', bio: '', years_of_experience: '',
        working_days: [] as string[], shift_start: '09:00', shift_end: '17:00',
    });

    const toggleDay = (day: string) => {
        setForm(f => ({ ...f, working_days: f.working_days.includes(day) ? f.working_days.filter(d => d !== day) : [...f.working_days, day] }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        const res = await userService.createUser({
            ...form,
            role: 'veterinarian',
            years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : undefined,
        });
        setSaving(false);
        if (res.success && res.data) {
            toastSuccess('Veterinarian account created.');
            router.visit(`/admin/veterinarians/${res.data.id}`);
        } else {
            setErrors(res.errors ?? {});
            toastError(res.message ?? 'Failed to create account.');
        }
    };

    return (
        <AppLayout>
            <Head title="New Veterinarian" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Stethoscope} title="New Veterinarian" subtitle="Create a veterinarian account" />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <BackLink href="/admin/veterinarians" label="Back to Veterinarians" />

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">Personal Details</p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Field label="First Name" value={form.first_name} onChange={v => setForm(f => ({ ...f, first_name: v }))} error={errors.first_name} />
                                <Field label="Last Name" value={form.last_name} onChange={v => setForm(f => ({ ...f, last_name: v }))} error={errors.last_name} />
                                <Field label="Email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} error={errors.email} />
                                <Field label="Phone Number" value={form.phone_number} onChange={v => setForm(f => ({ ...f, phone_number: v }))} error={errors.phone_number} />
                                <Field label="Password" type="password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} error={errors.password} />
                                <Field label="Confirm Password" type="password" value={form.password_confirmation} onChange={v => setForm(f => ({ ...f, password_confirmation: v }))} />
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">Professional Details</p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Field label="License Number" value={form.license_number} onChange={v => setForm(f => ({ ...f, license_number: v }))} error={errors.license_number} />
                                <Field label="Specialization" value={form.specialization} onChange={v => setForm(f => ({ ...f, specialization: v }))} error={errors.specialization} />
                                <Field label="Years of Experience" type="number" value={form.years_of_experience} onChange={v => setForm(f => ({ ...f, years_of_experience: v }))} />
                                <div className="grid grid-cols-2 gap-2">
                                    <Field label="Shift Start" type="time" value={form.shift_start} onChange={v => setForm(f => ({ ...f, shift_start: v }))} />
                                    <Field label="Shift End" type="time" value={form.shift_end} onChange={v => setForm(f => ({ ...f, shift_end: v }))} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Bio</label>
                                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300" />
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Working Days</label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map(day => (
                                        <button type="button" key={day} onClick={() => toggleDay(day)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                                                form.working_days.includes(day) ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-500 border-gray-200 hover:border-rose-300'
                                            }`}>
                                            {day.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: C.rose }}>
                            <Save className="w-4 h-4" /> {saving ? 'Creating…' : 'Create Account'}
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
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-rose-200 focus:border-rose-300'}`} />
            {error && <p className="text-xs text-red-500 mt-1">{error[0]}</p>}
        </div>
    );
}
