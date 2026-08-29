// resources/js/pages/Admin/Chat/Index.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Inbox, User as UserIcon } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { chatService } from '../../../services';
import type { ChatConversation } from '../../../services';
import { PageHeader, Avatar, StatusPill, EmptyState, C } from '../_shared/AdminUI';
import { timeAgo } from '../../Shared/helpers';

type Tab = 'unassigned' | 'mine' | 'all';

export default function AdminChatIndex() {
    const [tab, setTab] = useState<Tab>('unassigned');
    const [items, setItems] = useState<ChatConversation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = tab === 'unassigned' ? await chatService.getUnassignedConversations()
            : tab === 'mine' ? await chatService.getMyAssignedConversations()
            : await chatService.getConversations({ per_page: 30 });
        if (res.success) setItems(res.data ?? []);
        setLoading(false);
    }, [tab]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <AppLayout>
            <Head title="Live Chat" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={MessageSquare} title="Live Chat" subtitle="Support conversations" onRefresh={fetchData} />

                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <div className="flex items-center gap-2">
                        {(['unassigned', 'mine', 'all'] as Tab[]).map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors capitalize ${
                                    tab === t ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-500 border-gray-200 hover:border-rose-300'
                                }`}>
                                {t === 'mine' ? 'Assigned to Me' : t}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
                        ) : items.length === 0 ? (
                            <EmptyState icon={Inbox} title="No conversations" />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {items.map(c => (
                                    <Link key={c.id} href={`/admin/chat/${c.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                                        <Avatar user={c.owner} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-800 truncate">{c.owner?.full_name ?? c.owner?.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{c.latest_message?.message ?? 'No messages yet'}</p>
                                        </div>
                                        {(c.unread_count ?? 0) > 0 && <span className="text-[10px] font-black text-white bg-red-500 rounded-full px-1.5 py-0.5">{c.unread_count}</span>}
                                        <StatusPill label={c.status} color={c.status === 'open' ? 'green' : c.status === 'closed' ? 'gray' : 'amber'} />
                                        <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(c.last_message_at)}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
