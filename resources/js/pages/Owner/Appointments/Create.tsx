// resources/js/pages/Owner/Appointments/Create.tsx
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { CalendarClock, Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { petService, veterinarianService, appointmentService } from '@/services';
import type { Pet, User, AvailabilitySlot } from '@/services';
import { PageHeader, BackLink, toastSuccess, toastError, C } from '@/pages/Owner/_shared/OwnerUI';

export default function AppointmentCreate() {
    const [pets, setPets] = useState<Pet[]>([]);
    const [vets, setVets] = useState<User[]>([]);
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [timeError, setTimeError] = useState<string | null>(null);

    const initialPetId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('pet_id') : null;

    const BUSINESS_OPEN = '09:00';
    const BUSINESS_CLOSE_WEEKDAY = '17:30'; // Mon-Sat
    const BUSINESS_CLOSE_SUNDAY = '16:00';  // Sunday

    const [form, setForm] = useState({
        pet_id: initialPetId ?? '', veterinarian_id: '', appointment_date: '', appointment_time: '',
        service_type: '', reason: '',
    });

    useEffect(() => {
        (async () => {
            const [petsRes, vetsRes] = await Promise.all([petService.getPets({ per_page: 50 }), veterinarianService.getVeterinarians()]);
            if (petsRes.success) setPets(petsRes.data ?? []);
            if (vetsRes.success) setVets(vetsRes.data ?? []);
        })();
    }, []);

    useEffect(() => {
        if (!form.veterinarian_id || !form.appointment_date) { setSlots([]); return; }
        (async () => {
            setLoadingSlots(true);
            const res = await veterinarianService.getAvailability(Number(form.veterinarian_id), form.appointment_date);
            if (res.success) setSlots(res.data?.slots ?? []);
            setLoadingSlots(false);
        })();
    }, [form.veterinarian_id, form.appointment_date]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        setTimeError(null);

        const validationError = validateTime(form.appointment_time, form.appointment_date);
        if (validationError) {
            setTimeError(validationError);
            setSaving(false);
            return;
        }

        if (!form.veterinarian_id) {
            const slotCheck = await appointmentService.checkSlot(form.appointment_date, form.appointment_time);
            if (slotCheck.success && slotCheck.data && !slotCheck.data.available) {
                const closeTime = getBusinessClose(form.appointment_date);
                const reasons: Record<string, string> = {
                    already_booked: 'This time slot is already booked. Please choose another time.',
                    outside_business_hours: `Appointment time must be between 9:00 AM and ${formatTime12(closeTime)}.`,
                    past_time: 'Hindi puwedeng mag-book ng appointment sa oras na nakalipas na. Pumili ng ibang oras.',
                };
                setTimeError(reasons[slotCheck.data.reason] || slotCheck.data.reason || 'Invalid time slot.');
                setSaving(false);
                return;
            }
        }

        const res = await appointmentService.bookAppointment({
            pet_id: Number(form.pet_id),
            veterinarian_id: form.veterinarian_id ? Number(form.veterinarian_id) : undefined,
            appointment_date: form.appointment_date,
            appointment_time: form.appointment_time,
            service_type: form.service_type,
            reason: form.reason || undefined,
        });
        setSaving(false);
        if (res.success && res.data) {
            toastSuccess('Appointment booked!');
            router.visit(`/owner/appointments/${res.data.id}`);
        } else {
            setErrors(res.errors ?? {});
            toastError(res.message ?? 'Failed to book appointment.');
        }
    };

    const isWithinBusinessHours = (time: string, date?: string): boolean => {
        if (!time) return false;
        const closeTime = date ? getBusinessClose(date) : BUSINESS_CLOSE_WEEKDAY;
        return time >= BUSINESS_OPEN && time <= closeTime;
    };

    const getBusinessClose = (date: string): string => {
        if (!date) return BUSINESS_CLOSE_WEEKDAY;
        const dayOfWeek = new Date(date + 'T00:00:00').getDay(); // 0 = Sunday
        return dayOfWeek === 0 ? BUSINESS_CLOSE_SUNDAY : BUSINESS_CLOSE_WEEKDAY;
    };

    const isToday = (date: string): boolean => {
        return date === new Date().toISOString().slice(0, 10);
    };

    const getCurrentTimeRounded = (): string => {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        const rounded = m <= 30 ? 30 : 0;
        const hour = m <= 30 ? h : h + 1;
        return `${String(hour).padStart(2, '0')}:${String(rounded).padStart(2, '0')}`;
    };

    const isPastDateTime = (time: string, date: string): boolean => {
        if (!time || !date) return false;
        const selected = new Date(`${date}T${time}:00`);
        const now = new Date();
        return selected <= now;
    };

    const validateTime = (time: string, date?: string): string | null => {
        if (!time) return null;
        if (date && isToday(date) && isPastDateTime(time, date)) {
            return 'Hindi puwedeng mag-book ng appointment sa oras na nakalipas na. Pumili ng ibang oras.';
        }
        if (!isWithinBusinessHours(time, date)) {
            const closeTime = date ? getBusinessClose(date) : BUSINESS_CLOSE_WEEKDAY;
            return `Appointment time must be between 9:00 AM and ${formatTime12(closeTime)}.`;
        }
        return null;
    };

    const formatTime12 = (time24: string): string => {
        const [h, m] = time24.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${h12}:${String(m).padStart(2, '0')} ${period}`;
    };

    const today = new Date().toISOString().slice(0, 10);

    return (
        <AppLayout>
            <Head title="Book Appointment" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={CalendarClock} title="Book an Appointment" />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
                    <BackLink href="/owner/appointments" label="Back to Appointments" />

                    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Pet <span className="text-red-400">*</span></label>
                            <select value={form.pet_id} onChange={e => setForm(f => ({ ...f, pet_id: e.target.value }))} required
                                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.pet_id ? 'border-red-300' : 'border-gray-200 focus:ring-sky-200'}`}>
                                <option value="" disabled>Select a pet…</option>
                                {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
                            </select>
                            {errors.pet_id && <p className="text-xs text-red-500 mt-1">{errors.pet_id[0]}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Veterinarian (optional)</label>
                            <select value={form.veterinarian_id} onChange={e => setForm(f => ({ ...f, veterinarian_id: e.target.value, appointment_time: '' }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200">
                                <option value="">No preference</option>
                                {vets.map(v => <option key={v.id} value={v.id}>Dr. {v.full_name ?? v.name}{v.veterinarian_profile?.specialization ? ` — ${v.veterinarian_profile.specialization}` : ''}</option>)}
                            </select>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Date <span className="text-red-400">*</span></label>
                                <input type="date" min={today} value={form.appointment_date}
                                    onChange={e => setForm(f => ({ ...f, appointment_date: e.target.value, appointment_time: '' }))} required
                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.appointment_date ? 'border-red-300' : 'border-gray-200 focus:ring-sky-200'}`} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Time <span className="text-red-400">*</span></label>
                                {form.veterinarian_id && form.appointment_date ? (
                                    loadingSlots ? (
                                        <p className="text-xs text-gray-400 py-2.5">Checking availability…</p>
                                    ) : slots.length === 0 ? (
                                        <p className="text-xs text-gray-400 py-2.5">Not working this day.</p>
                                    ) : (
                                        <select value={form.appointment_time} onChange={e => {
                                            const val = e.target.value;
                                            setForm(f => ({ ...f, appointment_time: val }));
                                            setTimeError(validateTime(val, form.appointment_date));
                                        }} required
                                            className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.appointment_time || timeError ? 'border-red-300' : 'border-gray-200 focus:ring-sky-200'}`}>
                                            <option value="">Select a time…</option>
                                            {slots
                                                .filter(s => {
                                                    if (!isToday(form.appointment_date)) return true;
                                                    return !isPastDateTime(s.time, form.appointment_date);
                                                })
                                                .map(s => <option key={s.time} value={s.time} disabled={!s.available}>{s.time}{!s.available ? ' (booked)' : ''}</option>)
                                            }
                                        </select>
                                    )
                                ) : (
                                    <input type="time" value={form.appointment_time}
                                        min={isToday(form.appointment_date) ? getCurrentTimeRounded() : BUSINESS_OPEN}
                                        max={getBusinessClose(form.appointment_date || undefined)}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setForm(f => ({ ...f, appointment_time: val }));
                                            setTimeError(validateTime(val, form.appointment_date));
                                        }} required
                                        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.appointment_time || timeError ? 'border-red-300' : 'border-gray-200 focus:ring-sky-200'}`} />
                                )}
                                {errors.appointment_time && <p className="text-xs text-red-500 mt-1">{errors.appointment_time[0]}</p>}
                                {timeError && !errors.appointment_time && <p className="text-xs text-red-500 mt-1">{timeError}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Service Type <span className="text-red-400">*</span></label>
                            <select value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))} required
                                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${errors.service_type ? 'border-red-300' : 'border-gray-200 focus:ring-sky-200'}`}>
                                <option value="" disabled>Select a service…</option>
                                <option value="Vaccine">Vaccine</option>
                                <option value="Surgery">Surgery</option>
                                <option value="Grooming">Grooming</option>
                                <option value="Breeding">Breeding</option>
                                <option value="Bathing">Bathing</option>
                                <option value="Deworming">Deworming</option>
                                <option value="Ultrasound">Ultrasound</option>
                                <option value="ICG">ICG</option>
                                <option value="2D Echo">2D Echo</option>
                                <option value="Consultation">Consultation</option>
                            </select>
                            {errors.service_type && <p className="text-xs text-red-500 mt-1">{errors.service_type[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Reason for Visit</label>
                            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
                        </div>

                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background: C.sky }}>
                            <Save className="w-4 h-4" /> {saving ? 'Booking…' : 'Book Appointment'}
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
