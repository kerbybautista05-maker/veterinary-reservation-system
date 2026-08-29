// resources/js/pages/Admin/NotificationDetail.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Bell, ArrowRight } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { notificationService } from '../../services';
import type { Notification } from '../../services';
import { PageHeader, BackLink, C } from './_shared/AdminUI';
import { formatPHDateTime } from '../Shared/helpers';

export default function AdminNotificationDetail({ notificationId }: { notificationId: number | string }) {
    const [notification, setNotification] = useState<Notification | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const res = await notificationService.getNotifications({ per_page: 100 });
            const found = res.data?.find(n => n.id === Number(notificationId));
            if (found) {
                setNotification(found);
                if (!found.is_read) await notificationService.markRead(found.id);
            }
            setLoading(false);
        })();
    }, [notificationId]);

    if (loading) return <AppLayout><Head title="Notification" /><div className="p-10 text-center text-sm text-gray-400">Loading…</div></AppLayout>;
    if (!notification) return <AppLayout><Head title="Notification" /><div className="p-10 text-center text-sm text-gray-400">Notification not found.</div></AppLayout>;

    return (
        <AppLayout>
            <Head title={notification.title} />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Bell} title="Notification" />

                <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">
                    <BackLink href="/admin/notifications" label="Back to Notifications" />

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-rose-500">{notification.type.replace(/_/g, ' ')}</p>
                        <h2 className="text-lg font-black text-gray-800 mt-1">{notification.title}</h2>
                        <p className="text-sm text-gray-600 mt-3 leading-relaxed">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-4">{formatPHDateTime(notification.created_at)}</p>

                        {notification.deep_link && (
                            <Link href={notification.deep_link} className="inline-flex items-center gap-1.5 mt-5 px-4 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: C.rose }}>
                                View Details <ArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
