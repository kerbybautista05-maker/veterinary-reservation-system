// resources/js/pages/Owner/Feedback/Create.tsx
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Star, Send } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { appointmentService, feedbackService } from '@/services';
import type { Appointment } from '@/services';
import { PageHeader, BackLink, StarRatingInput, toastSuccess, toastError, C } from '@/pages/Owner/_shared/OwnerUI';

export default function FeedbackCreate() {
    const initialApptId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('appointment_id') : null;

    const [completedAppts, setCompletedAppts] = useState<Appointment[]>([]);
    const [appointmentId, setAppointmentId] = useState(initialApptId ?? '');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        (async () => {
            const res = await appointmentService.getAppointments({ status: 'completed', per_page: 30 });
            if (res.success) setCompletedAppts(res.data ?? []);
        })();
    }, []);

    const selected = completedAppts.find(a => a.id === Number(appointmentId));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        const res = await feedbackService.submitFeedback({
            appointment_id: appointmentId ? Number(appointmentId) : undefined,
            veterinarian_id: selected?.veterinarian_id ?? undefined,
            rating, comment: comment || undefined,
        });
        setSaving(false);
        if (res.success) {
            toastSuccess('Thank you for your feedback!');
            router.visit('/owner/feedback');
        } else {
            setErrors(res.errors ?? {});
            toastError(res.message ?? 'Failed to submit feedback.');
        }
    };

    return (
        <AppLayout>
            <Head title="Leave Feedback" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Star} title="Leave Feedback" />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <BackLink href="/owner/feedback" label="Back to Feedback" />

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        {completedAppts.length > 0 && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Which visit? (optional)</label>
                                <select value={appointmentId} onChange={e => setAppointmentId(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200">
                                    <option value="">General feedback</option>
                                    {completedAppts.map(a => (
                                        <option key={a.id} value={a.id}>{a.pet?.name} — {a.appointment_date}{a.veterinarian ? ` (Dr. ${a.veterinarian.full_name ?? a.veterinarian.name})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">Rating</label>
                            <StarRatingInput value={rating} onChange={setRating} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Comments</label>
                            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4}
                                placeholder="Tell us about your experience…"
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
                            {errors.comment && <p className="text-xs text-red-500 mt-1">{errors.comment[0]}</p>}
                        </div>

                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: C.sky }}>
                            <Send className="w-4 h-4" /> {saving ? 'Submitting…' : 'Submit Feedback'}
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
