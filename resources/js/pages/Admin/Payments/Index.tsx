// resources/js/pages/Admin/Payments/Index.tsx
import { Head } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { Wallet, Check, X, RotateCcw, FileText, ExternalLink } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { paymentService } from '../../../services';
import type { Payment, PaymentStatus } from '../../../services';
import { PageHeader, StatCard, StatusPill, EmptyState, Pagination, confirmAction, toastSuccess, toastError, C } from '../_shared/AdminUI';
import { formatPeso, formatPHDate } from '../../Shared/helpers';

const FILTERS: { value: PaymentStatus | ''; label: string }[] = [
    { value: '', label: 'All' }, { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' }, { value: 'failed', label: 'Failed' }, { value: 'refunded', label: 'Refunded' },
];

export default function PaymentsIndex() {
    const [items, setItems] = useState<Payment[]>([]);
    const [revenue, setRevenue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<PaymentStatus | ''>('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(undefined);
    const [receiptView, setReceiptView] = useState<Payment | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await paymentService.getPayments({ page, per_page: 15, status: status || undefined });
        if (res.success) { setItems(res.data ?? []); setPagination(res.pagination); setRevenue(res.total_revenue ?? 0); }
        setLoading(false);
    }, [page, status]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleMarkPaid = async (p: Payment) => {
        const ok = await confirmAction({ title: 'Confirm this payment was received?' });
        if (!ok) return;
        const res = await paymentService.markPaid(p.id);
        if (res.success) { toastSuccess('Payment marked as paid.'); fetchData(); }
        else toastError(res.message ?? 'Failed to update payment.');
    };

    const handleMarkFailed = async (p: Payment) => {
        const ok = await confirmAction({ title: 'Mark this payment as failed?', danger: true });
        if (!ok) return;
        const res = await paymentService.markFailed(p.id);
        if (res.success) { toastSuccess('Payment marked as failed.'); fetchData(); }
        else toastError(res.message ?? 'Failed to update payment.');
    };

    const handleRefund = async (p: Payment) => {
        const ok = await confirmAction({ title: 'Refund this payment?', danger: true, confirmText: 'Refund' });
        if (!ok) return;
        const res = await paymentService.refundPayment(p.id);
        if (res.success) { toastSuccess('Payment refunded.'); fetchData(); }
        else toastError(res.message ?? 'Failed to refund payment.');
    };

    return (
        <AppLayout>
            <Head title="Payments" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Wallet} title="Payments" subtitle="Transactions & revenue" onRefresh={fetchData} />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatCard icon={Wallet} label="Total Revenue" value={formatPeso(revenue)} color={C.green} />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {FILTERS.map(f => (
                            <button key={f.value} onClick={() => { setStatus(f.value); setPage(1); }}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                                    status === f.value ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-500 border-gray-200 hover:border-rose-300'
                                }`}>
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
                        ) : items.length === 0 ? (
                            <EmptyState icon={Wallet} title="No payments found" />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {items.map(p => (
                                    <div key={p.id} className="flex items-start gap-4 px-5 py-3.5">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-800 truncate">{formatPeso(p.amount)} · {p.owner?.full_name ?? p.owner?.name}</p>
                                            <p className="text-xs text-gray-400">{p.payment_method.replace('_', ' ')} · {formatPHDate(p.paid_at ?? p.created_at)}</p>
                                            {p.payment_reference && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    <span className="font-semibold text-gray-500">Reference:</span> {p.payment_reference}
                                                </p>
                                            )}
                                            {p.notes && (
                                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.notes}</p>
                                            )}
                                            {p.receipt_url && (
                                                <button onClick={() => setReceiptView(p)}
                                                    className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg px-2 py-1 -ml-2 transition-colors">
                                                    <FileText className="w-3.5 h-3.5" /> View Receipt
                                                </button>
                                            )}
                                        </div>
                                        <StatusPill label={p.status_label ?? p.status} color={p.status_color} />
                                        <div className="flex items-center gap-1 shrink-0">
                                            {p.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleMarkPaid(p)} title="Approve / mark as paid" className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"><Check className="w-4 h-4" /></button>
                                                    <button onClick={() => handleMarkFailed(p)} title="Reject / mark as failed" className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"><X className="w-4 h-4" /></button>
                                                </>
                                            )}
                                            {p.status === 'paid' && (
                                                <button onClick={() => handleRefund(p)} className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"><RotateCcw className="w-4 h-4" /></button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Pagination pagination={pagination} onPageChange={setPage} />
                    </div>
                </div>
            </div>

            {/* Receipt / proof of payment lightbox */}
            {receiptView?.receipt_url && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" onClick={() => setReceiptView(null)}>
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
                    <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-white truncate">
                                {formatPeso(receiptView.amount)} · {receiptView.payment_method.replace('_', ' ')}
                            </p>
                            <div className="flex items-center gap-1.5">
                                <a href={receiptView.receipt_url} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors">
                                    <ExternalLink className="w-3.5 h-3.5" /> Open
                                </a>
                                <button onClick={() => setReceiptView(null)}
                                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <img src={receiptView.receipt_url} alt="Payment receipt / proof of payment"
                            className="max-h-[82vh] max-w-full rounded-2xl shadow-2xl bg-white object-contain" />
                    </div>
                </div>
            )}
        </AppLayout>
    );
}