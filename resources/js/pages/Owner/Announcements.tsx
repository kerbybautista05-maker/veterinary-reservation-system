// resources/js/pages/Owner/Announcements.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { Megaphone } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { announcementService } from '@/services';
import type { Announcement } from '@/services';
import { PageHeader, EmptyState, Pagination, C } from '@/pages/Owner/_shared/OwnerUI';
import { formatPHDate } from '@/pages/Shared/helpers';

export default function OwnerAnnouncements() {
    const [items, setItems] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(undefined);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await announcementService.getAnnouncements({ page, per_page: 10 });
        if (res.success) { setItems(res.data ?? []); setPagination(res.pagination); }
        setLoading(false);
    }, [page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <AppLayout>
            <Head title="Announcements" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Megaphone} title="Announcements" subtitle="Clinic news & updates" onRefresh={fetchData} />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
                        ) : items.length === 0 ? (
                            <EmptyState icon={Megaphone} title="No announcements yet" />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {items.map(a => (
                                    <Link key={a.id} href={`/owner/announcements/${a.id}`} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                                        {a.image_url && <img src={a.image_url} className="w-14 h-14 rounded-xl object-cover shrink-0" />}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-800 truncate">{a.title}</p>
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{a.excerpt}</p>
                                            <p className="text-[11px] text-gray-400 mt-1">{formatPHDate(a.published_at ?? a.created_at)}</p>
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
