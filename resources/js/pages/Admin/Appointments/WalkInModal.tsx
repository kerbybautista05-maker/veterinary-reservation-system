import { useEffect, useState, useRef, useMemo } from 'react';
import { X, Plus, Search, Siren } from 'lucide-react';
import { appointmentService, veterinarianService } from '../../../services';
import type { User } from '../../../services';
import { C } from '../_shared/AdminUI';

const SERVICES = [
    'Vaccine', 'Surgery', 'Grooming', 'Breeding', 'Bathing',
    'Deworming', 'Ultrasound', 'ICG', '2D Echo', 'Consultation', 'Other',
];

const SYMPTOMS = [
    'Difficulty breathing', 'Severe bleeding', 'Seizures or collapse',
    'Vomiting blood', 'Inability to urinate', 'Heatstroke/overheating',
    'Poisoning or toxin ingestion', 'Severe trauma', 'Swollen abdomen/bloating',
    'Eye injury', 'Other',
];

const SEVERITY_OPTIONS = [
    { value: 'critical', label: 'Critical' },
    { value: 'serious', label: 'Serious' },
    { value: 'moderate', label: 'Moderate' },
];

interface WalkInModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function WalkInModal({ open, onClose, onSuccess }: WalkInModalProps) {
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    // ── Form state ─────────────────────────────────────────────────────────
    const [isEmergency, setIsEmergency] = useState(false);
    const [ownerName, setOwnerName] = useState('');
    const [ownerPhone, setOwnerPhone] = useState('');
    const [ownerEmail, setOwnerEmail] = useState('');
    const [petName, setPetName] = useState('');
    const [petSpecies, setPetSpecies] = useState('');
    const [petBreed, setPetBreed] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [otherService, setOtherService] = useState('');
    const [vetId, setVetId] = useState('');
    const [reason, setReason] = useState('');
    const [apptDate, setApptDate] = useState(new Date().toISOString().slice(0, 10));
    const [apptTime, setApptTime] = useState(() => {
        const n = new Date();
        return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
    });
    const [symptoms, setSymptoms] = useState<string[]>([]);
    const [severity, setSeverity] = useState('');
    const [otherSymptom, setOtherSymptom] = useState('');
    const [status, setStatus] = useState('confirmed');

    const [vets, setVets] = useState<User[]>([]);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        veterinarianService.getVeterinarians().then(res => {
            if (res.success) setVets(res.data ?? []);
        });
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [open, onClose]);

    const resetForm = () => {
        setIsEmergency(false);
        setOwnerName(''); setOwnerPhone(''); setOwnerEmail('');
        setPetName(''); setPetSpecies(''); setPetBreed('');
        setServiceType(''); setOtherService(''); setVetId('');
        setReason(''); setSymptoms([]); setSeverity('');
        setOtherSymptom(''); setStatus('confirmed');
        setApptDate(new Date().toISOString().slice(0, 10));
        const n = new Date();
        setApptTime(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`);
        setErrors({});
    };

    const handleClose = () => { resetForm(); onClose(); };

    const toggleSymptom = (s: string) => {
        setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        const payload: Record<string, any> = {
            owner_name: ownerName,
            owner_phone: ownerPhone,
            owner_email: ownerEmail || undefined,
            pet_name: petName,
            pet_species: petSpecies,
            pet_breed: petBreed || undefined,
            service_type: serviceType === 'Other' ? otherService : serviceType,
            veterinarian_id: vetId || undefined,
            reason: reason || undefined,
            appointment_date: apptDate,
            appointment_time: apptTime,
            is_emergency: isEmergency,
            status: isEmergency ? 'in_progress' : status,
        };

        if (isEmergency) {
            const allSymptoms = [...symptoms];
            if (symptoms.includes('Other') && otherSymptom.trim()) {
                allSymptoms.push(otherSymptom.trim());
            }
            payload.symptoms = allSymptoms.filter(s => s !== 'Other');
            payload.severity = severity;
        }

        const res = await appointmentService.logWalkIn(payload);
        setSaving(false);

        if (res.success) {
            onSuccess();
            handleClose();
        } else {
            setErrors(res.errors ?? {});
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
            <div ref={modalRef} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                        <Plus className="w-5 h-5" style={{ color: C.rose }} />
                        <h2 className="text-lg font-black text-gray-800">Log Walk-in</h2>
                    </div>
                    <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Emergency Toggle */}
                    <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                        style={{ background: isEmergency ? '#FEF2F2' : '#F9FAFB', borderColor: isEmergency ? '#FECACA' : '#E5E7EB' }}>
                        <input type="checkbox" checked={isEmergency} onChange={e => setIsEmergency(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                        <div className="flex items-center gap-2">
                            <Siren className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-bold text-gray-700">This is an emergency</span>
                        </div>
                    </label>

                    {/* Client / Owner */}
                    <fieldset className="space-y-3">
                        <legend className="text-xs font-bold text-gray-500 uppercase tracking-wider">Client Information</legend>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Owner Name <span className="text-red-400">*</span></label>
                                <input value={ownerName} onChange={e => setOwnerName(e.target.value)} required
                                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${errors.owner_name ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-sky-200'}`} />
                                {errors.owner_name && <p className="text-xs text-red-500 mt-1">{errors.owner_name[0]}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Contact Number <span className="text-red-400">*</span></label>
                                <input value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} required
                                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${errors.owner_phone ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-sky-200'}`} />
                                {errors.owner_phone && <p className="text-xs text-red-500 mt-1">{errors.owner_phone[0]}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Email Address <span className="text-gray-400 font-normal">(optional)</span></label>
                            <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
                            {errors.owner_email && <p className="text-xs text-red-500 mt-1">{errors.owner_email[0]}</p>}
                        </div>
                    </fieldset>

                    {/* Pet */}
                    <fieldset className="space-y-3">
                        <legend className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pet Information</legend>
                        <div className="grid sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Pet Name <span className="text-red-400">*</span></label>
                                <input value={petName} onChange={e => setPetName(e.target.value)} required
                                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${errors.pet_name ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-sky-200'}`} />
                                {errors.pet_name && <p className="text-xs text-red-500 mt-1">{errors.pet_name[0]}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Species <span className="text-red-400">*</span></label>
                                <input value={petSpecies} onChange={e => setPetSpecies(e.target.value)} required placeholder="e.g. Dog, Cat"
                                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${errors.pet_species ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-sky-200'}`} />
                                {errors.pet_species && <p className="text-xs text-red-500 mt-1">{errors.pet_species[0]}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Breed <span className="text-gray-400 font-normal">(optional)</span></label>
                                <input value={petBreed} onChange={e => setPetBreed(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
                            </div>
                        </div>
                    </fieldset>

                    {/* Visit Details */}
                    <fieldset className="space-y-3">
                        <legend className="text-xs font-bold text-gray-500 uppercase tracking-wider">Visit Details</legend>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Service <span className="text-red-400">*</span></label>
                                <select value={serviceType} onChange={e => setServiceType(e.target.value)} required
                                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${errors.service_type ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-sky-200'}`}>
                                    <option value="">Select a service…</option>
                                    {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                {errors.service_type && <p className="text-xs text-red-500 mt-1">{errors.service_type[0]}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Veterinarian <span className="text-gray-400 font-normal">(optional)</span></label>
                                <select value={vetId} onChange={e => setVetId(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200">
                                    <option value="">No preference</option>
                                    {vets.map(v => <option key={v.id} value={v.id}>Dr. {v.full_name ?? v.name}</option>)}
                                </select>
                            </div>
                        </div>
                        {serviceType === 'Other' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Specify Service <span className="text-red-400">*</span></label>
                                <input value={otherService} onChange={e => setOtherService(e.target.value)} required
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
                            </div>
                        )}
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                                <input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Time</label>
                                <input type="time" value={apptTime} onChange={e => setApptTime(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
                            </div>
                        </div>
                        {!isEmergency && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Initial Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200">
                                    <option value="confirmed">Confirmed</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Reason / Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Additional notes…"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200" />
                        </div>
                    </fieldset>

                    {/* Emergency-specific fields */}
                    {isEmergency && (
                        <fieldset className="space-y-3 p-4 rounded-xl bg-red-50 border border-red-200">
                            <legend className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                                <Siren className="w-3.5 h-3.5" /> Emergency Details
                            </legend>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">Symptoms <span className="text-red-400">*</span></label>
                                <div className="grid grid-cols-2 gap-2">
                                    {SYMPTOMS.map(s => (
                                        <label key={s} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                            <input type="checkbox" checked={symptoms.includes(s)} onChange={() => toggleSymptom(s)}
                                                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                                            {s}
                                        </label>
                                    ))}
                                </div>
                                {errors.symptoms && <p className="text-xs text-red-500 mt-1">{errors.symptoms[0]}</p>}
                            </div>

                            {symptoms.includes('Other') && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Describe other symptom</label>
                                    <input value={otherSymptom} onChange={e => setOtherSymptom(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Severity <span className="text-red-400">*</span></label>
                                <div className="flex gap-3">
                                    {SEVERITY_OPTIONS.map(opt => (
                                        <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                            <input type="radio" name="severity" value={opt.value} checked={severity === opt.value}
                                                onChange={e => setSeverity(e.target.value)}
                                                className="w-4 h-4 border-gray-300 text-red-600 focus:ring-red-500" />
                                            {opt.label}
                                        </label>
                                    ))}
                                </div>
                                {errors.severity && <p className="text-xs text-red-500 mt-1">{errors.severity[0]}</p>}
                            </div>
                        </fieldset>
                    )}

                    {/* Error summary */}
                    {errors.message && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-sm text-red-700">{errors.message}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                        <button type="button" onClick={handleClose}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-colors"
                            style={{ background: isEmergency ? C.red : C.rose }}>
                            {saving ? 'Saving…' : isEmergency ? 'Log Emergency Walk-in' : 'Log Walk-in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
