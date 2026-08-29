// resources/js/pages/Admin/Approvals/Index.tsx
import { Head } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { UserCheck, Check, X, Mail, Phone } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { userService } from '../../../services';
import type { User } from '../../../services';
import { PageHeader, Avatar, EmptyState, Pagination, confirmAction, toastSuccess, toastError, C } from '../_shared/AdminUI';
import { formatPHDate } from '../../Shared/helpers';

export default function ApprovalsIndex() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(undefined);
    const [busyId, setBusyId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await userService.getPendingApprovals({ page, per_page: 15 });
        if (res.success) {
            setUsers(res.data ?? []);
            setPagination(res.pagination);
        }
        setLoading(false);
    }, [page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleApprove = async (user: User) => {
        const ok = await confirmAction({ title: `Approve ${user.full_name ?? user.name}?`, text: 'They will be able to log in and book appointments.', confirmText: 'Approve' });
        if (!ok) return;
        setBusyId(user.id);
        const res = await userService.approveUser(user.id);
        setBusyId(null);
        if (res.success) { toastSuccess('Account approved.'); fetchData(); }
        else toastError(res.message ?? 'Failed to approve account.');
    };

    const handleReject = async (user: User) => {
        const { value: reason, isConfirmed } = await (await import('sweetalert2')).default.fire({
            title: `Decline ${user.full_name ?? user.name}?`,
            input: 'textarea',
            inputPlaceholder: 'Reason (optional)',
            showCancelButton: true,
            confirmButtonText: 'Decline',
            confirmButtonColor: C.red,
        });
        if (!isConfirmed) return;
        setBusyId(user.id);
        const res = await userService.rejectUser(user.id, { reason: reason || undefined });
        setBusyId(null);
        if (res.success) { toastSuccess('Account declined.'); fetchData(); }
        else toastError(res.message ?? 'Failed to decline account.');
    };

    return (
        <AppLayout>
            <Head title="Pending Approvals" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={UserCheck} title="Pending Approvals" subtitle="Pet Owner accounts awaiting review" onRefresh={fetchData} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
                        ) : users.length === 0 ? (
                            <EmptyState icon={UserCheck} title="All caught up" message="There are no pending Pet Owner accounts right now." />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {users.map(u => (
                                    <div key={u.id} className="flex items-center gap-4 px-5 py-4">
                                        <Avatar user={u} size="lg" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-800 truncate">{u.full_name ?? u.name}</p>
                                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</span>
                                                {u.phone_number && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone_number}</span>}
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Registered {formatPHDate(u.created_at)}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button disabled={busyId === u.id} onClick={() => handleApprove(u)}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors disabled:opacity-50">
                                                <Check className="w-3.5 h-3.5" /> Approve
                                            </button>
                                            <button disabled={busyId === u.id} onClick={() => handleReject(u)}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-colors disabled:opacity-50">
                                                <X className="w-3.5 h-3.5" /> Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Pagination pagination={pagination} onPageChange={setPage} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
