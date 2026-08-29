// resources/js/pages/Vet/Profile.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Stethoscope, Mail, Phone, Award, Clock, Pencil, KeyRound } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { userService } from '@/services';
import type { User } from '@/services';
import { PageHeader, Avatar, StatusPill, C } from '@/pages/Vet/_shared/VetUI';

export default function VetProfile() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const res = await userService.getProfile();
            if (res.success) setUser(res.data ?? null);
            setLoading(false);
        })();
    }, []);

    if (loading) return <AppLayout><Head title="My Profile" /><div className="p-10 text-center text-sm text-gray-400">Loading…</div></AppLayout>;
    if (!user) return <AppLayout><Head title="My Profile" /><div className="p-10 text-center text-sm text-gray-400">Unable to load profile.</div></AppLayout>;

    const profile = user.veterinarian_profile;

    return (
        <AppLayout>
            <Head title="My Profile" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={Stethoscope} title="My Profile" />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-4">
                                <Avatar user={user} size="lg" />
                                <div>
                                    <h2 className="text-lg font-black text-gray-800">Dr. {user.full_name ?? user.name}</h2>
                                    <p className="text-sm text-gray-500">{profile?.specialization ?? 'General Practice'}</p>
                                    {profile?.is_available_for_emergency && <StatusPill label="Available for Emergency" color="red" />}
                                </div>
                            </div>
                            <Link href="/vet/profile/edit" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold" style={{ background: C.blue }}>
                                <Pencil className="w-3.5 h-3.5" /> Edit Profile
                            </Link>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
                            <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-400" />{user.email}</div>
                            {user.phone_number && <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-400" />{user.phone_number}</div>}
                            {profile?.license_number && <div className="flex items-center gap-2 text-gray-600"><Award className="w-4 h-4 text-gray-400" />License #{profile.license_number}</div>}
                            {(profile?.shift_start || profile?.shift_end) && (
                                <div className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4 text-gray-400" />{profile.shift_start} – {profile.shift_end}</div>
                            )}
                        </div>
                        {profile?.bio && <p className="text-sm text-gray-600 mt-4 leading-relaxed">{profile.bio}</p>}
                        {profile?.working_days && profile.working_days.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-4">
                                {profile.working_days.map(d => (
                                    <span key={d} className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: `${C.blue}15`, color: C.blue }}>{d}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link href="/vet/profile/edit#password" className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:bg-gray-50 transition-colors">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${C.blue}15` }}>
                            <KeyRound className="w-4 h-4" style={{ color: C.blue }} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800">Change Password</p>
                            <p className="text-xs text-gray-400">Update your account password</p>
                        </div>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
