// resources/js/pages/Owner/Pets/Index.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { PawPrint, Plus } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { petService } from '@/services';
import type { Pet } from '@/services';
import { PageHeader, PetAvatar, EmptyState, C } from '@/pages/Owner/_shared/OwnerUI';

export default function OwnerPetsIndex() {
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await petService.getPets({ per_page: 50 });
        if (res.success) setPets(res.data ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <AppLayout>
            <Head title="My Pets" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={PawPrint} title="My Pets" subtitle="Manage your registered pets"
                    action={
                        <Link href="/owner/pets/create" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-sky-700 hover:bg-white/90 text-xs font-bold transition-all shadow-sm">
                            <Plus className="w-3.5 h-3.5" /> Add Pet
                        </Link>
                    }
                    onRefresh={fetchData}
                />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                    {loading ? (
                        <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
                    ) : pets.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <EmptyState icon={PawPrint} title="No pets yet" message="Add your first pet to start booking appointments."
                                action={<Link href="/owner/pets/create" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold" style={{ background: C.sky }}><Plus className="w-3.5 h-3.5" /> Add Your First Pet</Link>} />
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pets.map(p => (
                                <Link key={p.id} href={`/owner/pets/${p.id}`}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                                    <PetAvatar photoUrl={p.photo_url} size="lg" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-gray-800 truncate">{p.name}</p>
                                        <p className="text-xs text-gray-400">{p.species}{p.breed ? ` · ${p.breed}` : ''}</p>
                                        {p.age_label && <p className="text-[11px] text-gray-400 mt-0.5">{p.age_label} old</p>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
