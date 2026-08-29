// resources/js/pages/Admin/PetOwners/Index.tsx
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { Users, Search, Eye, Pencil, Power, Trash2, Mail, Phone } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { userService } from '../../../services';
import type { User } from '../../../services';
import { PageHeader, Avatar, StatusPill, EmptyState, Pagination, confirmAction, toastSuccess, toastError, C } from '../_shared/AdminUI';

export default function PetOwnersIndex() {
    const [owners, setOwners] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(undefined);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await userService.getPetOwners({ page, per_page: 15, search: search || undefined });
        if (res.success) { setOwners(res.data ?? []); setPagination(res.pagination); }
        setLoading(false);
    }, [page, search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleToggleActive = async (u: User) => {
        const ok = await confirmAction({ title: `${u.is_active ? 'Deactivate' : 'Activate'} ${u.full_name ?? u.name}?`, danger: u.is_active });
        if (!ok) return;
        const res = await userService.toggleActiveUser(u.id);
        if (res.success) { toastSuccess('Account status updated.'); fetchData(); }
        else toastError(res.message ?? 'Failed to update account.');
    };

    const handleDelete = async (u: User) => {
        const ok = await confirmAction({ title: `Delete ${u.full_name ?? u.name}?`, text: 'This can be restored later by support if needed.', danger: true, confirmText: 'Delete' });
        if (!ok) return;
        const res = await userService.deleteUser(u.id);
        if (res.success) { toastSuccess('Account deleted.'); fetchData(); }
        else toastError(res.message ?? 'Failed to delete account.');
    };

    return (
        <AppLayout>
            <Head title="Pet Owners" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Users} title="Pet Owners" subtitle="Manage pet owner accounts" onRefresh={fetchData} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <div className="relative max-w-sm">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search by name or email…"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
                        />
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
                        ) : owners.length === 0 ? (
                            <EmptyState icon={Users} title="No pet owners found" />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {owners.map(u => (
                                    <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
                                        <Avatar user={u} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-800 truncate">{u.full_name ?? u.name}</p>
                                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</span>
                                                {u.phone_number && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone_number}</span>}
                                            </div>
                                        </div>
                                        <StatusPill
                                            label={u.approval_status === 'approved' ? 'Active' : u.approval_status.charAt(0).toUpperCase() + u.approval_status.slice(1)}
                                            color={u.approval_status === 'approved' ? 'green' : u.approval_status === 'rejected' ? 'red' : 'amber'}
                                        />
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Link href={`/admin/pet-owners/${u.id}`} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"><Eye className="w-4 h-4" /></Link>
                                            <Link href={`/admin/pet-owners/${u.id}/edit`} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"><Pencil className="w-4 h-4" /></Link>
                                            <button onClick={() => handleToggleActive(u)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"><Power className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(u)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
