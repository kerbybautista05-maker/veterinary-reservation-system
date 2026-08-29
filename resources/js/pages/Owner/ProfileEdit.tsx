// resources/js/pages/Owner/ProfileEdit.tsx
import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { User as UserIcon, Save, KeyRound, Camera } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { userService } from '@/services';
import type { User } from '@/services';
import { PageHeader, BackLink, Avatar, toastSuccess, toastError, C } from '@/pages/Owner/_shared/OwnerUI';

export default function OwnerProfileEdit() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [pwErrors, setPwErrors] = useState<Record<string, string[]>>({});
    const [photo, setPhoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({ first_name: '', last_name: '', middle_name: '', suffix: '', phone_number: '', address: '' });
    const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' });

    useEffect(() => {
        (async () => {
            const res = await userService.getProfile();
            if (res.success && res.data) {
                const u = res.data;
                setUser(u);
                setForm({
                    first_name: u.first_name ?? '', last_name: u.last_name ?? '', middle_name: u.middle_name ?? '',
                    suffix: u.suffix ?? '', phone_number: u.phone_number ?? '', address: u.address ?? '',
                });
                setPreview(u.profile_photo_url ?? null);
            }
            setLoading(false);
        })();
    }, []);

    const onPickPhoto = (file?: File) => {
        if (!file) return;
        setPhoto(file);
        setPreview(URL.createObjectURL(file));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        const res = await userService.updateProfile({ ...form, profile_photo: photo ?? undefined });
        setSaving(false);
        if (res.success) {
            toastSuccess('Profile updated.');
            router.visit('/owner/profile');
        } else {
            setErrors(res.errors ?? {});
            toastError(res.message ?? 'Failed to update profile.');
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
                <PageHeader icon={UserIcon} title="Edit Profile" />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <BackLink href="/owner/profile" label="Back to Profile" />

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => fileRef.current?.click()} className="relative group">
                                {preview ? <img src={preview} className="w-16 h-16 rounded-2xl object-cover" /> : <Avatar user={user} size="lg" />}
                                <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Camera className="w-5 h-5 text-white" />
                                </div>
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => onPickPhoto(e.target.files?.[0])} />
                            <p className="text-xs text-gray-400">Click your photo to update it</p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="First Name" value={form.first_name} onChange={v => setForm(f => ({ ...f, first_name: v }))} error={errors.first_name} />
                            <Field label="Last Name" value={form.last_name} onChange={v => setForm(f => ({ ...f, last_name: v }))} error={errors.last_name} />
                            <Field label="Middle Name" value={form.middle_name} onChange={v => setForm(f => ({ ...f, middle_name: v }))} />
                            <Field label="Suffix" value={form.suffix} onChange={v => setForm(f => ({ ...f, suffix: v }))} />
                        </div>
                        <Field label="Phone Number" value={form.phone_number} onChange={v => setForm(f => ({ ...f, phone_number: v }))} error={errors.phone_number} />
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Address</label>
                            <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={3}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300" />
                        </div>

                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: C.sky }}>
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
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-sky-200 focus:border-sky-300'}`} />
            {error && <p className="text-xs text-red-500 mt-1">{error[0]}</p>}
        </div>
    );
}
