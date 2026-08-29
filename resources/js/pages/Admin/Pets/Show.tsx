// resources/js/pages/Admin/Pets/Show.tsx
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { PawPrint, Stethoscope } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { petService, petMedicalRecordService } from '@/services';
import type { Pet, PetMedicalRecord } from '@/services';
import { PageHeader, BackLink, EmptyState, C } from '@/pages/Admin/_shared/AdminUI';
import { formatPHDate } from '@/pages/Shared/helpers';

export default function PetShow({ petId }: { petId: number | string }) {
    const [pet, setPet] = useState<Pet | null>(null);
    const [records, setRecords] = useState<PetMedicalRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const res = await petService.getPet(Number(petId));
            if (res.success && res.data) {
                setPet(res.data);
                const rec = await petMedicalRecordService.getRecordsForPet(Number(petId));
                if (rec.success) setRecords(rec.data ?? []);
            }
            setLoading(false);
        })();
    }, [petId]);

    if (loading) return <AppLayout><Head title="Pet" /><div className="p-10 text-center text-sm text-gray-400">Loading…</div></AppLayout>;
    if (!pet) return <AppLayout><Head title="Pet" /><div className="p-10 text-center text-sm text-gray-400">Pet not found.</div></AppLayout>;

    return (
        <AppLayout>
            <Head title={pet.name} />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={PawPrint} title="Pet Profile" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <BackLink href="/admin/pets" label="Back to Pets" />

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <div className="flex items-center gap-4">
                                    {pet.photo_url ? (
                                        <img src={pet.photo_url} className="w-16 h-16 rounded-2xl object-cover" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center"><PawPrint className="w-7 h-7 text-rose-400" /></div>
                                    )}
                                    <div>
                                        <h2 className="text-lg font-black text-gray-800">{pet.name}</h2>
                                        <p className="text-sm text-gray-500">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''} · {pet.sex}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Owner: {pet.owner?.full_name ?? pet.owner?.name}</p>
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-3 gap-4 mt-6 text-sm">
                                    {pet.age_label && <div><p className="text-xs text-gray-400 font-bold uppercase">Age</p><p className="text-gray-700">{pet.age_label}</p></div>}
                                    {pet.weight_kg && <div><p className="text-xs text-gray-400 font-bold uppercase">Weight</p><p className="text-gray-700">{pet.weight_kg} kg</p></div>}
                                    {pet.microchip_id && <div><p className="text-xs text-gray-400 font-bold uppercase">Microchip</p><p className="text-gray-700">{pet.microchip_id}</p></div>}
                                </div>
                                {pet.allergies && <p className="text-sm text-red-600 mt-4"><span className="font-bold">Allergies:</span> {pet.allergies}</p>}
                                {pet.notes && <p className="text-sm text-gray-600 mt-2">{pet.notes}</p>}
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                                    <Stethoscope className="w-4 h-4 text-gray-400" />
                                    <p className="text-sm font-black text-gray-800">Medical Records</p>
                                </div>
                                {records.length === 0 ? (
                                    <EmptyState icon={Stethoscope} title="No medical records yet" />
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {records.map(r => (
                                            <div key={r.id} className="px-5 py-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-bold text-gray-800">{r.diagnosis ?? 'Visit'}</p>
                                                    <span className="text-xs text-gray-400">{formatPHDate(r.visit_date)}</span>
                                                </div>
                                                {r.treatment && <p className="text-xs text-gray-500 mt-1">{r.treatment}</p>}
                                                <p className="text-[11px] text-gray-400 mt-1">Dr. {r.veterinarian?.full_name ?? r.veterinarian?.name}</p>
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