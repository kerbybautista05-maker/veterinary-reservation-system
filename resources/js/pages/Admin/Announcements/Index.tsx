// resources/js/pages/Admin/Announcements/Index.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { Megaphone, Plus, Pencil, Trash2, Search } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { announcementService } from '../../../services';
import type { Announcement } from '../../../services';
import { PageHeader, StatusPill, EmptyState, Pagination, confirmAction, toastSuccess, toastError, C } from '../_shared/AdminUI';
import { formatPHDate } from '../../Shared/helpers';

export default function AnnouncementsIndex() {
    const [items, setItems] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(undefined);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await announcementService.getAnnouncements({ page, per_page: 10, search: search || undefined });
        if (res.success) { setItems(res.data ?? []); setPagination(res.pagination); }
        setLoading(false);
    }, [page, search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = async (a: Announcement) => {
        const ok = await confirmAction({ title: `Delete "${a.title}"?`, danger: true, confirmText: 'Delete' });
        if (!ok) return;
        const res = await announcementService.deleteAnnouncement(a.id);
        if (res.success) { toastSuccess('Announcement deleted.'); fetchData(); }
        else toastError(res.message ?? 'Failed to delete announcement.');
    };

    return (
        <AppLayout>
            <Head title="Announcements" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Megaphone} title="Announcements" subtitle="Post clinic-wide news"
                    action={
                        <Link href="/admin/announcements/create" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-rose-600 hover:bg-white/90 text-xs font-bold transition-all shadow-sm">
                            <Plus className="w-3.5 h-3.5" /> New Announcement
                        </Link>
                    }
                    onRefresh={fetchData}
                />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <div className="relative max-w-sm">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search announcements…"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300" />
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
                        ) : items.length === 0 ? (
                            <EmptyState icon={Megaphone} title="No announcements yet" />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {items.map(a => (
                                    <div key={a.id} className="flex items-start gap-4 px-5 py-4">
                                        {a.image_url && <img src={a.image_url} className="w-14 h-14 rounded-xl object-cover shrink-0" />}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-gray-800 truncate">{a.title}</p>
                                                <StatusPill label={a.status_label ?? 'Draft'} color={a.status_color} />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{a.excerpt}</p>
                                            <p className="text-[11px] text-gray-400 mt-1">By {a.author?.full_name ?? a.author?.name} · {formatPHDate(a.published_at ?? a.created_at)}</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Link href={`/admin/announcements/${a.id}/edit`} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"><Pencil className="w-4 h-4" /></Link>
                                            <button onClick={() => handleDelete(a)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
