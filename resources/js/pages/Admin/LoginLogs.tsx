// resources/js/pages/Admin/LoginLogs.tsx
import { Head } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { KeyRound, CheckCircle2, XCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { loginLogService } from '../../services';
import type { LoginLog, LoginLogStatus } from '../../services';
import { PageHeader, EmptyState, Pagination, C } from './_shared/AdminUI';
import { formatPHDateTime, getDisplayName } from '../Shared/helpers';

export default function AdminLoginLogs() {
    const [logs, setLogs] = useState<LoginLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<LoginLogStatus | ''>('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(undefined);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await loginLogService.getLoginLogs({ page, per_page: 25, status: status || undefined });
        if (res.success) { setLogs(res.data ?? []); setPagination(res.pagination); }
        setLoading(false);
    }, [page, status]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <AppLayout>
            <Head title="Login Logs" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={KeyRound} title="Login Logs" subtitle="Login attempt history" onRefresh={fetchData} />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <div className="flex items-center gap-2">
                        {(['', 'success', 'failed'] as (LoginLogStatus | '')[]).map(s => (
                            <button key={s || 'all'} onClick={() => { setStatus(s); setPage(1); }}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors capitalize ${
                                    status === s ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-500 border-gray-200 hover:border-rose-300'
                                }`}>
                                {s || 'All'}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
                        ) : logs.length === 0 ? (
                            <EmptyState icon={KeyRound} title="No login attempts recorded" />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {logs.map(l => (
                                    <div key={l.id} className="px-5 py-3 flex items-center gap-3">
                                        {l.status === 'success'
                                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-gray-700 truncate">{l.user ? getDisplayName(l.user) : (l.email ?? 'Unknown')}</p>
                                            <p className="text-xs text-gray-400">{l.ip_address ?? 'Unknown IP'}</p>
                                        </div>
                                        <span className="text-xs text-gray-400 shrink-0">{formatPHDateTime(l.logged_in_at)}</span>
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
