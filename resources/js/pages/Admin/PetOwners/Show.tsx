// resources/js/pages/Admin/PetOwners/Show.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Users, Mail, Phone, MapPin, Calendar, Pencil, ShieldCheck } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { userService, activityLogService } from '../../../services';
import type { User, ActivityLog } from '../../../services';
import { PageHeader, Avatar, StatusPill, BackLink, C } from '../_shared/AdminUI';
import { formatPHDateTime } from '../../Shared/helpers';

export default function PetOwnerShow({ ownerId }: { ownerId: number | string }) {
    const [owner, setOwner] = useState<User | null>(null);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const res = await userService.getUser(Number(ownerId));
            if (res.success && res.data) {
                setOwner(res.data);
                const history = await activityLogService.getSubjectHistory({ type: 'App\\Models\\User', id: res.data.id });
                if (history.success) setLogs(history.data ?? []);
            }
            setLoading(false);
        })();
    }, [ownerId]);

    if (loading) return <AppLayout><Head title="Pet Owner" /><div className="p-10 text-center text-sm text-gray-400">Loading…</div></AppLayout>;
    if (!owner) return <AppLayout><Head title="Pet Owner" /><div className="p-10 text-center text-sm text-gray-400">Account not found.</div></AppLayout>;

    return (
        <AppLayout>
            <Head title={owner.full_name ?? owner.name ?? 'Pet Owner'} />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Users} title="Pet Owner Profile" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <BackLink href="/admin/pet-owners" label="Back to Pet Owners" />

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-4">
                                <Avatar user={owner} size="lg" />
                                <div>
                                    <h2 className="text-lg font-black text-gray-800">{owner.full_name ?? owner.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <StatusPill
                                            label={owner.approval_status === 'approved' ? 'Active' : owner.approval_status.charAt(0).toUpperCase() + owner.approval_status.slice(1)}
                                            color={owner.approval_status === 'approved' ? 'green' : owner.approval_status === 'rejected' ? 'red' : 'amber'}
                                        />
                                    </div>
                                </div>
                            </div>
                            <Link href={`/admin/pet-owners/${owner.id}/edit`}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold" style={{ background: C.rose }}>
                                <Pencil className="w-3.5 h-3.5" /> Edit
                            </Link>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
                            <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-400" />{owner.email}</div>
                            {owner.phone_number && <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-400" />{owner.phone_number}</div>}
                            {owner.address && <div className="flex items-center gap-2 text-gray-600 sm:col-span-2"><MapPin className="w-4 h-4 text-gray-400" />{owner.address}</div>}
                            <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4 text-gray-400" />Registered {formatPHDateTime(owner.created_at)}</div>
                            {owner.approved_at && <div className="flex items-center gap-2 text-gray-600"><ShieldCheck className="w-4 h-4 text-gray-400" />Approved {formatPHDateTime(owner.approved_at)}</div>}
                        </div>
                        {owner.rejection_reason && (
                            <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
                                <span className="font-bold">Rejection reason:</span> {owner.rejection_reason}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100"><p className="text-sm font-black text-gray-800">Account Activity</p></div>
                        {logs.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-400">No recorded activity yet.</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {logs.map(l => (
                                    <div key={l.id} className="px-5 py-3 flex items-center justify-between gap-3">
                                        <span className="text-sm text-gray-700 font-medium capitalize">{l.action.replace(/_/g, ' ')}</span>
                                        <span className="text-xs text-gray-400">{formatPHDateTime(l.created_at)}</span>
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
