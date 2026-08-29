// resources/js/pages/Owner/Payments/Show.tsx
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Wallet, FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { paymentService } from '@/services';
import type { Payment } from '@/services';
import { PageHeader, BackLink, StatusPill, C } from '@/pages/Owner/_shared/OwnerUI';
import { formatPeso, formatPHDateTime } from '@/pages/Shared/helpers';

export default function OwnerPaymentShow({ paymentId }: { paymentId: number | string }) {
    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const res = await paymentService.getPayment(Number(paymentId));
            if (res.success) setPayment(res.data ?? null);
            setLoading(false);
        })();
    }, [paymentId]);

    if (loading) return <AppLayout><Head title="Payment" /><div className="p-10 text-center text-sm text-gray-400">Loading…</div></AppLayout>;
    if (!payment) return <AppLayout><Head title="Payment" /><div className="p-10 text-center text-sm text-gray-400">Payment not found.</div></AppLayout>;

    return (
        <AppLayout>
            <Head title={`Payment #${payment.id}`} />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Wallet} title="Payment Details" />

                <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">
                    <BackLink href="/owner/payments" label="Back to Payments" />

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-black text-gray-800">{formatPeso(payment.amount)}</p>
                            <StatusPill label={payment.status_label ?? payment.status} color={payment.status_color} />
                        </div>

                        <div className="space-y-3 mt-6 text-sm">
                            <Row label="Method" value={payment.payment_method.replace('_', ' ')} />
                            {payment.transaction_reference && <Row label="Reference" value={payment.transaction_reference} />}
                            <Row label="Date" value={formatPHDateTime(payment.paid_at ?? payment.created_at)} />
                            {payment.appointment?.pet && <Row label="For" value={payment.appointment.pet.name} />}
                        </div>

                        {payment.receipt_url && (
                            <a href={payment.receipt_url} target="_blank" rel="noreferrer"
                                className="flex items-center justify-center gap-2 mt-6 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                <FileText className="w-4 h-4" /> View Receipt
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase">{label}</span>
            <span className="text-gray-700 font-medium capitalize">{value}</span>
        </div>
    );
}
