// resources/js/pages/Admin/Notifications.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { notificationService } from '../../services';
import type { Notification } from '../../services';
import { PageHeader, EmptyState, Pagination, toastSuccess, C } from './_shared/AdminUI';
import { timeAgo } from '../Shared/helpers';

export default function AdminNotifications() {
    const [items, setItems] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(undefined);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await notificationService.getNotifications({ page, per_page: 20 });
        if (res.success) { setItems(res.data ?? []); setPagination(res.pagination); }
        setLoading(false);
    }, [page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleMarkAllRead = async () => {
        const res = await notificationService.markAllRead();
        if (res.success) { toastSuccess('All notifications marked as read.'); fetchData(); }
    };

    const handleOpen = async (n: Notification) => {
        if (!n.is_read) await notificationService.markRead(n.id);
    };

    return (
        <AppLayout>
            <Head title="Notifications" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Bell} title="Notifications"
                    action={
                        <button onClick={handleMarkAllRead} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10">
                            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                        </button>
                    }
                    onRefresh={fetchData}
                />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
                        ) : items.length === 0 ? (
                            <EmptyState icon={Bell} title="No notifications" />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {items.map(n => (
                                    <Link key={n.id} href={`/admin/notifications/${n.id}`} onClick={() => handleOpen(n)}
                                        className={`flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-rose-50/40' : ''}`}>
                                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />}
                                        <div className={`min-w-0 flex-1 ${n.is_read ? 'pl-5' : ''}`}>
                                            <p className="text-sm font-bold text-gray-800 truncate">{n.title}</p>
                                            <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                                            <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                                        </div>
                                    </Link>
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
