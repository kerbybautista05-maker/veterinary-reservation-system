// resources/js/pages/Owner/Payments/Index.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { Wallet, Plus } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { paymentService } from '@/services';
import type { Payment } from '@/services';
import { PageHeader, StatusPill, EmptyState, Pagination, C } from '@/pages/Owner/_shared/OwnerUI';
import { formatPeso, formatPHDate } from '@/pages/Shared/helpers';

export default function OwnerPaymentsIndex() {
    const [items, setItems] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(undefined);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await paymentService.getPayments({ page, per_page: 15 });
        if (res.success) { setItems(res.data ?? []); setPagination(res.pagination); }
        setLoading(false);
    }, [page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <AppLayout>
            <Head title="My Payments" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Wallet} title="My Payments" subtitle="Billing & receipts"
                    action={
                        <Link href="/owner/payments/create" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-sky-700 hover:bg-white/90 text-xs font-bold transition-all shadow-sm">
                            <Plus className="w-3.5 h-3.5" /> New Payment
                        </Link>
                    }
                    onRefresh={fetchData}
                />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
                        ) : items.length === 0 ? (
                            <EmptyState icon={Wallet} title="No payments yet" message="Submit a payment for a confirmed or completed appointment."
                                action={<Link href="/owner/payments/create" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold" style={{ background: C.sky }}><Plus className="w-3.5 h-3.5" /> Submit a Payment</Link>} />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {items.map(p => (
                                    <Link key={p.id} href={`/owner/payments/${p.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-800">{formatPeso(p.amount)}</p>
                                            <p className="text-xs text-gray-400">{p.payment_method.replace('_', ' ')} · {formatPHDate(p.created_at)}</p>
                                        </div>
                                        <StatusPill label={p.status_label ?? p.status} color={p.status_color} />
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
