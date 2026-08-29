// resources/js/pages/Owner/Payments/Create.tsx
import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Wallet, Save, Upload, X } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { appointmentService, paymentService } from '@/services';
import type { Appointment, PaymentMethod } from '@/services';
import { PageHeader, BackLink, toastSuccess, toastError, C } from '@/pages/Owner/_shared/OwnerUI';
import { formatPHDate } from '@/pages/Shared/helpers';

const METHODS: { value: PaymentMethod; label: string }[] = [
    { value: 'cash', label: 'Cash (pay at clinic)' },
    { value: 'gcash', label: 'GCash' },
    { value: 'paymaya', label: 'PayMaya' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
];

export default function PaymentCreate() {
    const initialApptId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('appointment_id') : null;

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [appointmentId, setAppointmentId] = useState(initialApptId ?? '');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<PaymentMethod>('cash');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [receipt, setReceipt] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        (async () => {
            // Completed and confirmed visits are both billable — a pet owner
            // may want to pay ahead of a confirmed appointment too.
            const [completed, confirmed] = await Promise.all([
                appointmentService.getAppointments({ status: 'completed', per_page: 30 }),
                appointmentService.getAppointments({ status: 'confirmed', per_page: 30 }),
            ]);
            const combined = [...(completed.data ?? []), ...(confirmed.data ?? [])];
            setAppointments(combined);
        })();
    }, []);

    const selected = appointments.find(a => a.id === Number(appointmentId));
    const isOnlinePayment = method !== 'cash';

    const onMethodChange = (m: PaymentMethod) => {
        setMethod(m);
        if (m === 'cash') {
            setReference('');
            setReceipt(null);
            setPreview(null);
        }
    };

    const onPickReceipt = (file?: File) => {
        if (!file) return;
        setReceipt(file);
        setPreview(URL.createObjectURL(file));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        if (!appointmentId) {
            setErrors({ appointment_id: ['Please select an appointment.'] });
            setSaving(false);
            return;
        }
        if (!amount || Number(amount) <= 0) {
            setErrors({ amount: ['Enter a valid amount.'] });
            setSaving(false);
            return;
        }
        if (method !== 'cash') {
            const clientErrors: Record<string, string[]> = {};
            if (!reference.trim()) clientErrors.transaction_reference = ['Reference number is required for online payments.'];
            if (!receipt) clientErrors.receipt = ['Receipt / proof of payment is required for online payments.'];
            if (Object.keys(clientErrors).length > 0) {
                setErrors(clientErrors);
                setSaving(false);
                return;
            }
        }

        const res = await paymentService.createPayment({
            appointment_id: Number(appointmentId),
            amount: Number(amount),
            currency: 'PHP',
            payment_method: method,
            transaction_reference: reference || undefined,
            receipt: receipt ?? undefined,
            notes: notes || undefined,
        });
        setSaving(false);
        if (res.success && res.data) {
            toastSuccess('Payment submitted — the clinic will confirm it shortly.');
            router.visit(`/owner/payments/${res.data.id}`);
        } else {
            setErrors(res.errors ?? {});
            toastError(res.message ?? 'Failed to submit payment.');
        }
    };

    return (
        <AppLayout>
            <Head title="Submit Payment" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Wallet} title="Submit Payment" subtitle="Record a payment for one of your visits" />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <BackLink href="/owner/payments" label="Back to Payments" />

                    <div className="mb-4 px-4 py-3 rounded-xl border border-blue-100 bg-blue-50 text-sm text-blue-800">
                        This records that you've paid — the clinic will review and confirm it. If you're paying in cash
                        at the clinic, you can still log it here so it shows up in your payment history right away.
                    </div>

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Appointment</label>
                            <select value={appointmentId} onChange={e => setAppointmentId(e.target.value)} required
                                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.appointment_id ? 'border-red-300' : 'border-gray-200 focus:ring-sky-200'}`}>
                                <option value="">Select an appointment…</option>
                                {appointments.map(a => (
                                    <option key={a.id} value={a.id}>
                                        {a.pet?.name} — {formatPHDate(a.appointment_date)}
                                        {a.service_type ? ` (${a.service_type})` : ''} · {a.status_label ?? a.status}
                                    </option>
                                ))}
                            </select>
                            {errors.appointment_id && <p className="text-xs text-red-500 mt-1">{errors.appointment_id[0]}</p>}
                            {appointments.length === 0 && (
                                <p className="text-xs text-gray-400 mt-1.5">No completed or confirmed appointments found yet.</p>
                            )}
                            {selected?.veterinarian && (
                                <p className="text-xs text-gray-400 mt-1.5">Attending: Dr. {selected.veterinarian.full_name ?? selected.veterinarian.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Amount (₱)</label>
                            <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required
                                placeholder="0.00"
                                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.amount ? 'border-red-300' : 'border-gray-200 focus:ring-sky-200'}`} />
                            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Payment Method</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {METHODS.map(m => (
                                    <button type="button" key={m.value} onClick={() => onMethodChange(m.value)}
                                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors text-left ${
                                            method === m.value ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
                                        }`}
                                        style={method === m.value ? { background: C.sky } : undefined}>
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {method !== 'cash' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                                    Reference / Transaction Number <span className="text-red-400">*</span>
                                </label>
                                <input value={reference} onChange={e => setReference(e.target.value)}
                                    placeholder="e.g. GCash reference number"
                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.transaction_reference ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-sky-200'}`} />
                                {errors.transaction_reference && <p className="text-xs text-red-500 mt-1">{errors.transaction_reference[0]}</p>}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">
                                Receipt / Proof of Payment {isOnlinePayment ? <span className="text-red-400">*</span> : <span className="text-gray-300 font-medium">(optional)</span>}
                            </label>
                            {preview ? (
                                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200">
                                    <img src={preview} className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => { setReceipt(null); setPreview(null); }}
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70"><X className="w-3.5 h-3.5" /></button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => fileRef.current?.click()}
                                    className={`w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors ${errors.receipt ? 'border-red-300 text-red-400' : 'border-gray-200 text-gray-400 hover:border-sky-300 hover:text-sky-500'}`}>
                                    <Upload className="w-5 h-5" /><span className="text-xs font-semibold">Upload a screenshot or photo</span>
                                </button>
                            )}
                            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => onPickReceipt(e.target.files?.[0])} />
                            {errors.receipt && <p className="text-xs text-red-500 mt-1">{errors.receipt[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Notes <span className="text-gray-300 font-medium">(optional)</span></label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
                        </div>

                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: C.sky }}>
                            <Save className="w-4 h-4" /> {saving ? 'Submitting…' : 'Submit Payment'}
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
