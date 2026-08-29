// resources/js/pages/Admin/ActivityLogs.tsx
import { Head } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, Search } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { activityLogService } from '@/services';
import type { ActivityLog } from '@/services';
import { PageHeader, EmptyState, Pagination, C } from '@/pages/Admin/_shared/AdminUI';
import { formatPHDateTime, getDisplayName } from '@/pages/Shared/helpers';

export default function AdminActivityLogs() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(undefined);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await activityLogService.getActivityLogs({ page, per_page: 25, search: search || undefined });
        if (res.success) { setLogs(res.data ?? []); setPagination(res.pagination); }
        setLoading(false);
    }, [page, search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <AppLayout>
            <Head title="Activity Logs" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={ShieldCheck} title="Activity Logs" subtitle="System-wide audit trail" onRefresh={fetchData} />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <div className="relative max-w-sm">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by action or IP…"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300" />
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
                        ) : logs.length === 0 ? (
                            <EmptyState icon={ShieldCheck} title="No activity recorded yet" />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {logs.map(l => (
                                    <div key={l.id} className="px-5 py-3 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-700 capitalize truncate">{l.action.replace(/_/g, ' ')}</p>
                                            <p className="text-xs text-gray-400">
                                                {l.user ? getDisplayName(l.user) : 'System'}
                                                {l.subject_type && <span> · {l.subject_type.split('\\').pop()} #{l.subject_id}</span>}
                                                {l.ip_address && <span> · {l.ip_address}</span>}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-400 shrink-0">{formatPHDateTime(l.created_at)}</span>
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