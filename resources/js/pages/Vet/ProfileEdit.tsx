// resources/js/pages/Vet/ProfileEdit.tsx
import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Stethoscope, Save, KeyRound, Camera } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { userService, veterinarianService } from '@/services';
import type { User } from '@/services';
import { PageHeader, BackLink, Avatar, toastSuccess, toastError, C } from '@/pages/Vet/_shared/VetUI';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function VetProfileEdit() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [pwErrors, setPwErrors] = useState<Record<string, string[]>>({});
    const [photo, setPhoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const [account, setAccount] = useState({ first_name: '', last_name: '', phone_number: '' });
    const [profile, setProfile] = useState({
        license_number: '', specialization: '', bio: '', years_of_experience: '',
        working_days: [] as string[], shift_start: '09:00', shift_end: '17:00', is_available_for_emergency: false,
    });
    const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' });

    useEffect(() => {
        (async () => {
            const res = await userService.getProfile();
            if (res.success && res.data) {
                const u = res.data;
                setUser(u);
                setAccount({ first_name: u.first_name ?? '', last_name: u.last_name ?? '', phone_number: u.phone_number ?? '' });
                setPreview(u.profile_photo_url ?? null);
                const p = u.veterinarian_profile;
                if (p) {
                    setProfile({
                        license_number: p.license_number ?? '', specialization: p.specialization ?? '', bio: p.bio ?? '',
                        years_of_experience: p.years_of_experience ? String(p.years_of_experience) : '',
                        working_days: p.working_days ?? [], shift_start: p.shift_start ?? '09:00', shift_end: p.shift_end ?? '17:00',
                        is_available_for_emergency: p.is_available_for_emergency,
                    });
                }
            }
            setLoading(false);
        })();
    }, []);

    const toggleDay = (day: string) => {
        setProfile(p => ({ ...p, working_days: p.working_days.includes(day) ? p.working_days.filter(d => d !== day) : [...p.working_days, day] }));
    };

    const onPickPhoto = (file?: File) => {
        if (!file) return;
        setPhoto(file);
        setPreview(URL.createObjectURL(file));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setErrors({});
        const [accountRes, profileRes] = await Promise.all([
            userService.updateProfile({ ...account, profile_photo: photo ?? undefined }),
            veterinarianService.updateVeterinarianProfile(user.id, {
                ...profile,
                years_of_experience: profile.years_of_experience ? Number(profile.years_of_experience) : undefined,
            }),
        ]);
        setSaving(false);
        if (accountRes.success && profileRes.success) {
            toastSuccess('Profile updated.');
            router.visit('/vet/profile');
        } else {
            setErrors({ ...accountRes.errors, ...profileRes.errors });
            toastError(accountRes.message ?? profileRes.message ?? 'Failed to update profile.');
        }
    };

    const submitPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setChangingPassword(true);
        setPwErrors({});
        const res = await userService.changePassword(pwForm);
        setChangingPassword(false);
        if (res.success) {
            toastSuccess('Password changed.');
            setPwForm({ current_password: '', password: '', password_confirmation: '' });
        } else {
            setPwErrors(res.errors ?? {});
            toastError(res.message ?? 'Failed to change password.');
        }
    };

    if (loading) return <AppLayout><Head title="Edit Profile" /><div className="p-10 text-center text-sm text-gray-400">Loading…</div></AppLayout>;

    return (
        <AppLayout>
            <Head title="Edit Profile" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Stethoscope} title="Edit Profile" />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <BackLink href="/vet/profile" label="Back to Profile" />

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => fileRef.current?.click()} className="relative group">
                                {preview ? <img src={preview} className="w-16 h-16 rounded-2xl object-cover" /> : <Avatar user={user} size="lg" />}
                                <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Camera className="w-5 h-5 text-white" />
                                </div>
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => onPickPhoto(e.target.files?.[0])} />
                        </div>

                        <div>
                            <p className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">Personal Details</p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Field label="First Name" value={account.first_name} onChange={v => setAccount(a => ({ ...a, first_name: v }))} error={errors.first_name} />
                                <Field label="Last Name" value={account.last_name} onChange={v => setAccount(a => ({ ...a, last_name: v }))} error={errors.last_name} />
                                <Field label="Phone Number" value={account.phone_number} onChange={v => setAccount(a => ({ ...a, phone_number: v }))} error={errors.phone_number} />
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">Professional Details</p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Field label="License Number" value={profile.license_number} onChange={v => setProfile(p => ({ ...p, license_number: v }))} error={errors.license_number} />
                                <Field label="Specialization" value={profile.specialization} onChange={v => setProfile(p => ({ ...p, specialization: v }))} error={errors.specialization} />
                                <Field label="Years of Experience" type="number" value={profile.years_of_experience} onChange={v => setProfile(p => ({ ...p, years_of_experience: v }))} />
                                <div className="grid grid-cols-2 gap-2">
                                    <Field label="Shift Start" type="time" value={profile.shift_start} onChange={v => setProfile(p => ({ ...p, shift_start: v }))} />
                                    <Field label="Shift End" type="time" value={profile.shift_end} onChange={v => setProfile(p => ({ ...p, shift_end: v }))} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Bio</label>
                                <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Working Days</label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map(day => (
                                        <button type="button" key={day} onClick={() => toggleDay(day)}
                                            className="px-3 py-1.5 rounded-full text-xs font-bold border transition-colors"
                                            style={profile.working_days.includes(day)
                                                ? { background: C.blue, color: '#fff', borderColor: C.blue }
                                                : { background: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }}>
                                            {day.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mt-4">
                                <input type="checkbox" checked={profile.is_available_for_emergency} onChange={e => setProfile(p => ({ ...p, is_available_for_emergency: e.target.checked }))} className="rounded" />
                                Available for emergency bookings
                            </label>
                        </div>

                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: C.blue }}>
                            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </form>

                    <form id="password" onSubmit={submitPassword} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <p className="text-sm font-black text-gray-800 flex items-center gap-2"><KeyRound className="w-4 h-4 text-gray-400" /> Change Password</p>
                        <Field label="Current Password" type="password" value={pwForm.current_password} onChange={v => setPwForm(f => ({ ...f, current_password: v }))} error={pwErrors.current_password} />
                        <Field label="New Password" type="password" value={pwForm.password} onChange={v => setPwForm(f => ({ ...f, password: v }))} error={pwErrors.password} />
                        <Field label="Confirm New Password" type="password" value={pwForm.password_confirmation} onChange={v => setPwForm(f => ({ ...f, password_confirmation: v }))} />
                        <button type="submit" disabled={changingPassword}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: C.navy }}>
                            <KeyRound className="w-4 h-4" /> {changingPassword ? 'Updating…' : 'Update Password'}
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
