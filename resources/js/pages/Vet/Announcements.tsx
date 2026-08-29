// resources/js/pages/Vet/Announcements.tsx
import { Head } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { Megaphone } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { announcementService } from '@/services';
import type { Announcement } from '@/services';
import { PageHeader, EmptyState, Pagination, C } from '@/pages/Vet/_shared/VetUI';
import { formatPHDate } from '@/pages/Shared/helpers';

export default function VetAnnouncements() {
    const [items, setItems] = useState<Announcement[]>([]);
    const [expanded, setExpanded] = useState<number | null>(null);
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
                                {items.map(a => {
                                    const isOpen = expanded === a.id;
                                    return (
                                        <div key={a.id}>
                                            <button onClick={() => setExpanded(isOpen ? null : a.id)}
                                                className="w-full text-left flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                                                {a.image_url && <img src={a.image_url} className="w-14 h-14 rounded-xl object-cover shrink-0" />}
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-gray-800 truncate">{a.title}</p>
                                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{a.excerpt}</p>
                                                    <p className="text-[11px] text-gray-400 mt-1">{formatPHDate(a.published_at ?? a.created_at)}</p>
                                                </div>
                                            </button>
                                            {isOpen && (
                                                <div className="px-5 pb-5 prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: a.body }} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <Pagination pagination={pagination} onPageChange={setPage} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
