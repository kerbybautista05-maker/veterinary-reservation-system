// resources/js/pages/Admin/Feedback/Index.tsx
import { Head } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { Star, MessageSquareReply, Eye, EyeOff } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { feedbackService } from '../../../services';
import type { Feedback } from '../../../services';
import { PageHeader, StatusPill, EmptyState, Pagination, toastSuccess, toastError, C } from '../_shared/AdminUI';
import { formatPHDate } from '../../Shared/helpers';
import Swal from 'sweetalert2';

export default function FeedbackIndex() {
    const [items, setItems] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(undefined);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await feedbackService.getFeedback({ page, per_page: 10, include_unpublished: true });
        if (res.success) { setItems(res.data ?? []); setPagination(res.pagination); }
        setLoading(false);
    }, [page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRespond = async (f: Feedback) => {
        const { value: response, isConfirmed } = await Swal.fire({
            title: 'Respond to feedback', input: 'textarea', inputPlaceholder: 'Write your response…',
            showCancelButton: true, confirmButtonText: 'Send', confirmButtonColor: C.rose,
            inputValue: f.admin_response ?? '',
        });
        if (!isConfirmed || !response) return;
        const res = await feedbackService.respondToFeedback(f.id, { response });
        if (res.success) { toastSuccess('Response sent.'); fetchData(); }
        else toastError(res.message ?? 'Failed to send response.');
    };

    const handleTogglePublish = async (f: Feedback) => {
        const res = await feedbackService.togglePublish(f.id);
        if (res.success) { toastSuccess(f.is_published ? 'Feedback hidden.' : 'Feedback published.'); fetchData(); }
        else toastError(res.message ?? 'Failed to update feedback.');
    };

    return (
        <AppLayout>
            <Head title="Feedback" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Star} title="Feedback" subtitle="Reviews & ratings from pet owners" onRefresh={fetchData} />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
                        ) : items.length === 0 ? (
                            <EmptyState icon={Star} title="No feedback yet" />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {items.map(f => (
                                    <div key={f.id} className="px-5 py-4">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div>
                                                <span className="text-amber-500">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                                                <span className="text-xs text-gray-400 ml-2">by {f.owner?.full_name ?? f.owner?.name} · {formatPHDate(f.created_at)}</span>
                                            </div>
                                            <StatusPill label={f.is_published ? 'Published' : 'Hidden'} color={f.is_published ? 'green' : 'gray'} />
                                        </div>
                                        {f.veterinarian && <p className="text-xs text-gray-400 mt-1">Re: Dr. {f.veterinarian.full_name ?? f.veterinarian.name}</p>}
                                        {f.comment && <p className="text-sm text-gray-700 mt-2">{f.comment}</p>}
                                        {f.admin_response && (
                                            <div className="mt-3 pl-3 border-l-2 border-rose-200">
                                                <p className="text-xs font-bold text-rose-600">Clinic response</p>
                                                <p className="text-sm text-gray-600">{f.admin_response}</p>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 mt-3">
                                            <button onClick={() => handleRespond(f)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-colors">
                                                <MessageSquareReply className="w-3.5 h-3.5" /> {f.admin_response ? 'Edit Response' : 'Respond'}
                                            </button>
                                            <button onClick={() => handleTogglePublish(f)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 text-xs font-bold transition-colors">
                                                {f.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {f.is_published ? 'Hide' : 'Publish'}
                                            </button>
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
