// resources/js/pages/Owner/Profile.tsx
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { User as UserIcon, Mail, Phone, MapPin, Pencil, KeyRound } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { userService } from '@/services';
import type { User } from '@/services';
import { PageHeader, Avatar, C } from '@/pages/Owner/_shared/OwnerUI';

export default function OwnerProfile() {
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

    return (
        <AppLayout>
            <Head title="My Profile" />
            <div className="min-h-screen" style={{ background: C.bg }}>
                <PageHeader icon={UserIcon} title="My Profile" />

                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-4">
                                <Avatar user={user} size="lg" />
                                <div>
                                    <h2 className="text-lg font-black text-gray-800">{user.full_name ?? user.name}</h2>
                                    <p className="text-xs text-gray-400">Pet Owner</p>
                                </div>
                            </div>
                            <Link href="/owner/profile/edit" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold" style={{ background: C.sky }}>
                                <Pencil className="w-3.5 h-3.5" /> Edit Profile
                            </Link>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
                            <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-400" />{user.email}</div>
                            {user.phone_number && <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-400" />{user.phone_number}</div>}
                            {user.address && <div className="flex items-center gap-2 text-gray-600 sm:col-span-2"><MapPin className="w-4 h-4 text-gray-400" />{user.address}</div>}
                        </div>
                    </div>

                    <Link href="/owner/profile/edit#password" className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:bg-gray-50 transition-colors">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${C.sky}15` }}>
                            <KeyRound className="w-4 h-4" style={{ color: C.sky }} />
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
