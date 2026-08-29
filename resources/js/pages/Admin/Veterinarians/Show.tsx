// resources/js/pages/Admin/Veterinarians/Show.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Stethoscope, Mail, Phone, Pencil, Award, Clock, Star } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { veterinarianService, feedbackService } from '../../../services';
import type { User, Feedback } from '../../../services';
import { PageHeader, Avatar, StatusPill, BackLink, EmptyState, C } from '../_shared/AdminUI';

export default function VeterinarianShow({ vetId }: { vetId: number | string }) {
    const [vet, setVet] = useState<User | null>(null);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const res = await veterinarianService.getVeterinarian(Number(vetId));
            if (res.success && res.data) {
                setVet(res.data);
                const fb = await feedbackService.getFeedback({ veterinarian_id: res.data.id, include_unpublished: true, per_page: 5 });
                if (fb.success) setFeedback(fb.data ?? []);
            }
            setLoading(false);
        })();
    }, [vetId]);

    if (loading) return <AppLayout><Head title="Veterinarian" /><div className="p-10 text-center text-sm text-gray-400">Loading…</div></AppLayout>;
    if (!vet) return <AppLayout><Head title="Veterinarian" /><div className="p-10 text-center text-sm text-gray-400">Veterinarian not found.</div></AppLayout>;

    const profile = vet.veterinarian_profile;

    return (
        <AppLayout>
            <Head title={`Dr. ${vet.full_name ?? vet.name}`} />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Stethoscope} title="Veterinarian Profile" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <BackLink href="/admin/veterinarians" label="Back to Veterinarians" />

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-4">
                                <Avatar user={vet} size="lg" />
                                <div>
                                    <h2 className="text-lg font-black text-gray-800">Dr. {vet.full_name ?? vet.name}</h2>
                                    <p className="text-sm text-gray-500">{profile?.specialization ?? 'General Practice'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <StatusPill label={vet.is_active ? 'Active' : 'Inactive'} color={vet.is_active ? 'green' : 'gray'} />
                                        {profile?.is_available_for_emergency && <StatusPill label="Available for Emergency" color="red" />}
                                    </div>
                                </div>
                            </div>
                            <Link href={`/admin/veterinarians/${vet.id}/edit`}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold" style={{ background: C.rose }}>
                                <Pencil className="w-3.5 h-3.5" /> Edit
                            </Link>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
                            <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-400" />{vet.email}</div>
                            {vet.phone_number && <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-400" />{vet.phone_number}</div>}
                            {profile?.license_number && <div className="flex items-center gap-2 text-gray-600"><Award className="w-4 h-4 text-gray-400" />License #{profile.license_number}</div>}
                            {(profile?.shift_start || profile?.shift_end) && (
                                <div className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4 text-gray-400" />{profile.shift_start} – {profile.shift_end}</div>
                            )}
                        </div>
                        {profile?.bio && <p className="text-sm text-gray-600 mt-4 leading-relaxed">{profile.bio}</p>}
                        {profile?.working_days && profile.working_days.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-4">
                                {profile.working_days.map(d => (
                                    <span key={d} className="text-[11px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-600">{d}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100"><p className="text-sm font-black text-gray-800">Recent Feedback</p></div>
                        {feedback.length === 0 ? (
                            <EmptyState icon={Star} title="No feedback yet" />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {feedback.map(f => (
                                    <div key={f.id} className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-amber-500 text-sm">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                                            <span className="text-xs text-gray-400">by {f.owner?.full_name ?? f.owner?.name}</span>
                                        </div>
                                        {f.comment && <p className="text-sm text-gray-600 mt-1">{f.comment}</p>}
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
