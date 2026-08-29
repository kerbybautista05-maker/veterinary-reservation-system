// resources/js/pages/Owner/Feedback/Index.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { Star, Plus } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { feedbackService } from '@/services';
import type { Feedback } from '@/services';
import { PageHeader, EmptyState, C } from '@/pages/Owner/_shared/OwnerUI';
import { formatPHDate } from '@/pages/Shared/helpers';

export default function OwnerFeedbackIndex() {
    const [items, setItems] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await feedbackService.getFeedback({ per_page: 30 });
        if (res.success) setItems(res.data ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <AppLayout>
            <Head title="My Feedback" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Star} title="My Feedback"
                    action={
                        <Link href="/owner/feedback/create" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-sky-700 hover:bg-white/90 text-xs font-bold transition-all shadow-sm">
                            <Plus className="w-3.5 h-3.5" /> Leave Feedback
                        </Link>
                    }
                    onRefresh={fetchData}
                />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
                        ) : items.length === 0 ? (
                            <EmptyState icon={Star} title="No feedback submitted yet" />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {items.map(f => (
                                    <div key={f.id} className="px-5 py-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-amber-500">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                                            <span className="text-xs text-gray-400">{formatPHDate(f.created_at)}</span>
                                        </div>
                                        {f.veterinarian && <p className="text-xs text-gray-400 mt-1">Re: Dr. {f.veterinarian.full_name ?? f.veterinarian.name}</p>}
                                        {f.comment && <p className="text-sm text-gray-700 mt-2">{f.comment}</p>}
                                        {f.admin_response && (
                                            <div className="mt-3 pl-3 border-l-2" style={{ borderColor: C.sky }}>
                                                <p className="text-xs font-bold" style={{ color: C.sky }}>Clinic response</p>
                                                <p className="text-sm text-gray-600">{f.admin_response}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
