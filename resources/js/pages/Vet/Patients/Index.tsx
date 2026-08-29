// resources/js/pages/Vet/Patients/Index.tsx
import { Head, Link } from '@inertiajs/react';
import { useState, useCallback, useRef } from 'react';
import { Users, Search } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { petMedicalRecordService } from '@/services';
import type { Pet } from '@/services';
import { PageHeader, PetAvatar, EmptyState, C } from '@/pages/Vet/_shared/VetUI';

export default function VetPatientsIndex() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const runSearch = useCallback(async (q: string) => {
        if (q.trim().length < 2) { setResults([]); setSearched(false); return; }
        setLoading(true);
        const res = await petMedicalRecordService.searchPatients(q.trim());
        if (res.success) setResults(res.data ?? []);
        setSearched(true);
        setLoading(false);
    }, []);

    const onChange = (value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => runSearch(value), 350);
    };

    return (
        <AppLayout>
            <Head title="Patients" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Users} title="Patients" subtitle="Search patient information" />

                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={query}
                            onChange={e => onChange(e.target.value)}
                            placeholder="Search by pet name, microchip ID, or owner name…"
                            autoFocus
                            className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                        />
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-sm text-gray-400">Searching…</div>
                        ) : !searched ? (
                            <EmptyState icon={Search} title="Start typing to search" message="Search across all registered pets and their owners." />
                        ) : results.length === 0 ? (
                            <EmptyState icon={Users} title="No patients found" message="Try a different name or microchip ID." />
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {results.map(p => (
                                    <Link key={p.id} href={`/vet/patients/${p.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                                        <PetAvatar photoUrl={p.photo_url} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-800 truncate">{p.name}</p>
                                            <p className="text-xs text-gray-400">{p.species}{p.breed ? ` · ${p.breed}` : ''} · Owner: {p.owner?.full_name ?? p.owner?.name}</p>
                                        </div>
                                        {p.microchip_id && <span className="text-[11px] text-gray-400 shrink-0">#{p.microchip_id}</span>}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
