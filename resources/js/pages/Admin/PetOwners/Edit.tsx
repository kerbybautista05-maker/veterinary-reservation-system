// resources/js/pages/Admin/PetOwners/Edit.tsx
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Users, Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { userService } from '../../../services';
import type { User } from '../../../services';
import { PageHeader, BackLink, toastSuccess, toastError, C } from '../_shared/AdminUI';

export default function PetOwnerEdit({ ownerId }: { ownerId: number | string }) {
    const [owner, setOwner] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [form, setForm] = useState({
        first_name: '', last_name: '', middle_name: '', suffix: '',
        email: '', phone_number: '', address: '', is_active: true,
    });

    useEffect(() => {
        (async () => {
            const res = await userService.getUser(Number(ownerId));
            if (res.success && res.data) {
                const u = res.data;
                setOwner(u);
                setForm({
                    first_name: u.first_name ?? '', last_name: u.last_name ?? '',
                    middle_name: u.middle_name ?? '', suffix: u.suffix ?? '',
                    email: u.email, phone_number: u.phone_number ?? '',
                    address: u.address ?? '', is_active: u.is_active,
                });
            }
            setLoading(false);
        })();
    }, [ownerId]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        const res = await userService.updateUser(Number(ownerId), form);
        setSaving(false);
        if (res.success) {
            toastSuccess('Pet owner updated.');
            router.visit(`/admin/pet-owners/${ownerId}`);
        } else {
            setErrors(res.errors ?? {});
            toastError(res.message ?? 'Failed to update account.');
        }
    };

    if (loading) return <AppLayout><Head title="Edit Pet Owner" /><div className="p-10 text-center text-sm text-gray-400">Loading…</div></AppLayout>;
    if (!owner) return <AppLayout><Head title="Edit Pet Owner" /><div className="p-10 text-center text-sm text-gray-400">Account not found.</div></AppLayout>;

    return (
        <AppLayout>
            <Head title={`Edit ${owner.full_name ?? owner.name}`} />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Users} title="Edit Pet Owner" />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <BackLink href={`/admin/pet-owners/${ownerId}`} label="Back to Profile" />

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="First Name" value={form.first_name} onChange={v => setForm(f => ({ ...f, first_name: v }))} error={errors.first_name} />
                            <Field label="Last Name" value={form.last_name} onChange={v => setForm(f => ({ ...f, last_name: v }))} error={errors.last_name} />
                            <Field label="Middle Name" value={form.middle_name} onChange={v => setForm(f => ({ ...f, middle_name: v }))} error={errors.middle_name} />
                            <Field label="Suffix" value={form.suffix} onChange={v => setForm(f => ({ ...f, suffix: v }))} error={errors.suffix} />
                        </div>
                        <Field label="Email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} error={errors.email} />
                        <Field label="Phone Number" value={form.phone_number} onChange={v => setForm(f => ({ ...f, phone_number: v }))} error={errors.phone_number} />
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Address</label>
                            <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={3}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300" />
                        </div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                            Account active
                        </label>

                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: C.rose }}>
                            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
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
