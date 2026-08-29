// resources/js/pages/Owner/Appointments/Emergency.tsx
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Siren, Send } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { petService, appointmentService } from '@/services';
import type { Pet } from '@/services';
import { BackLink, toastSuccess, toastError, C } from '@/pages/Owner/_shared/OwnerUI';

export default function AppointmentEmergency() {
    const [pets, setPets] = useState<Pet[]>([]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [form, setForm] = useState({ pet_id: '', reason: '' });

    useEffect(() => {
        (async () => {
            const res = await petService.getPets({ per_page: 50 });
            if (res.success) setPets(res.data ?? []);
        })();
    }, []);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        if (!form.pet_id) {
            setErrors({ pet_id: ['Please select a pet.'] });
            setSaving(false);
            return;
        }
        if (!form.reason.trim()) {
            setErrors({ reason: ['Please describe what is happening.'] });
            setSaving(false);
            return;
        }

        const now = new Date();
        const res = await appointmentService.bookEmergencyAppointment({
            pet_id: Number(form.pet_id),
            appointment_date: now.toISOString().slice(0, 10),
            appointment_time: now.toTimeString().slice(0, 5),
            reason: form.reason || undefined,
        });
        setSaving(false);
        if (res.success && res.data) {
            toastSuccess('Emergency request sent — the clinic has been notified.');
            router.visit(`/owner/appointments/${res.data.id}`);
        } else {
            setErrors(res.errors ?? {});
            toastError(res.message ?? 'Failed to send emergency request.');
        }
    };

    return (
        <AppLayout>
            <Head title="Emergency Booking" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.red} 0%, #B91C1C 100%)` }}>
                    <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15 shrink-0">
                                <Siren className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">NE Veterinary Clinic</p>
                                <h1 className="text-xl font-black text-white leading-tight">Emergency Booking</h1>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <BackLink href="/owner/appointments" label="Back to Appointments" />

                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                        <p className="text-sm text-red-800">
                            <span className="font-bold">For life-threatening emergencies, call the clinic directly.</span> This form
                            immediately notifies our team and any available veterinarian, but response time isn't guaranteed to be instant.
                        </p>
                    </div>

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Which pet needs help?</label>
                            <select value={form.pet_id} onChange={e => setForm(f => ({ ...f, pet_id: e.target.value }))} required
                                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.pet_id ? 'border-red-300' : 'border-gray-200 focus:ring-red-200'}`}>
                                <option value="">Select a pet…</option>
                                {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
                            </select>
                            {errors.pet_id && <p className="text-xs text-red-500 mt-1">{errors.pet_id[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">What's happening?</label>
                            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={4} required
                                placeholder="Describe the symptoms or situation…"
                                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-red-200 ${errors.reason ? 'border-red-300' : 'border-gray-200'}`} />
                            {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason[0]}</p>}
                        </div>

                        <button type="submit" disabled={saving}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-black disabled:opacity-50" style={{ background: C.red }}>
                            <Send className="w-4 h-4" /> {saving ? 'Sending…' : 'Send Emergency Request'}
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
