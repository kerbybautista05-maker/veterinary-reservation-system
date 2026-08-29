// resources/js/pages/Admin/Pets/Index.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
import { PawPrint, Search, Eye } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { petService } from '@/services';
import type { Pet } from '@/services';
import { PageHeader, StatusPill, EmptyState, Pagination, C } from '@/pages/Admin/_shared/AdminUI';

export default function PetsIndex() {
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(undefined);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await petService.getPets({ page, per_page: 15, search: search || undefined });
        if (res.success) { setPets(res.data ?? []); setPagination(res.pagination); }
        setLoading(false);
    }, [page, search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <AppLayout>
            <Head title="Pets" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={PawPrint} title="Pets" subtitle="All registered pets" onRefresh={fetchData} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <div className="relative max-w-sm">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by pet name…"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300" />
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
                        ) : pets.length === 0 ? (
                            <EmptyState icon={PawPrint} title="No pets found" />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {pets.map(p => (
                                    <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                                        {p.photo_url ? (
                                            <img src={p.photo_url} className="w-10 h-10 rounded-xl object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center"><PawPrint className="w-5 h-5 text-rose-400" /></div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-800 truncate">{p.name}</p>
                                            <p className="text-xs text-gray-400">{p.species} {p.breed ? `· ${p.breed}` : ''} · Owner: {p.owner?.full_name ?? p.owner?.name}</p>
                                        </div>
                                        <StatusPill label={p.is_active ? 'Active' : 'Inactive'} color={p.is_active ? 'green' : 'gray'} />
                                        <Link href={`/admin/pets/${p.id}`} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"><Eye className="w-4 h-4" /></Link>
                                    </div>
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