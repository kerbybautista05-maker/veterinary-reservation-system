// resources/js/components/AppHeader.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    Menu, X, User, LogOut, ChevronDown,
    LayoutDashboard, PawPrint, CalendarDays, CalendarClock,
    Stethoscope, Bell, Megaphone, MessageSquare, HeartPulse,
    Star, Wallet, Users, ShieldCheck, ScrollText, Search,
    UserCheck, MoreHorizontal,
} from 'lucide-react';
import { csrfGet, csrfPost } from '@/utils/csrfFetch';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClinicNotification {
    id: number;
    title?: string;
    message: string;
    type?: string;
    is_read?: boolean;
    created_at: string;
    deep_link?: string;
}

interface PageProps {
    auth?: {
        user?: {
            id: number;
            last_name?: string;
            first_name?: string;
            middle_name?: string;
            suffix?: string;
            name?: string;
            full_name?: string;
            profile_photo_url?: string;
            email: string;
            phone_number?: string;
            role: 'pet_owner' | 'veterinarian' | 'admin';
            approval_status?: 'pending' | 'approved' | 'rejected';
            is_active: boolean;
        };
    };
    unreadNotifications?: ClinicNotification[];
    [key: string]: unknown;
}

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    isNotification?: boolean;
    isChatItem?: boolean;
    badgeCount?: number;
}

interface NavGroup {
    label: string;
    icon: React.ElementType;
    items: (NavItem & { subtitle?: string })[];
    badge?: string;
}

interface NavConfig {
    primary: NavItem[];
    groups: NavGroup[];
    notifItem?: NavItem;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUserDisplayName(user: PageProps['auth']['user']): string {
    if (!user) return 'User';
    if (user.first_name && user.last_name) {
        const mi  = user.middle_name ? ' ' + user.middle_name.charAt(0) + '.' : '';
        const sfx = user.suffix ? ' ' + user.suffix : '';
        return `${user.first_name}${mi} ${user.last_name}${sfx}`;
    }
    return user.name ?? user.full_name ?? 'User';
}

function getUserInitials(user: PageProps['auth']['user']): string {
    if (!user) return '?';
    if (user.first_name && user.last_name) return (user.first_name[0] + user.last_name[0]).toUpperCase();
    const name = user.name ?? '';
    if (name) return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    return '?';
}

function getRoleLabel(role: string): string {
    return { admin: 'Administrator', veterinarian: 'Veterinarian', pet_owner: 'Pet Owner' }[role] ?? 'User';
}

const isActiveRoute = (href: string, pathname: string): boolean => {
    if (pathname === href) return true;
    const hrefParts = href.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length <= hrefParts.length) return false;
    return hrefParts.every((seg, i) => seg === pathParts[i]);
};

// ─── Role Themes ──────────────────────────────────────────────────────────────

type RoleTheme = {
    gradient: string; solidBg: string; text: string;
    hover: string; border: string; label: string; ring: string;
};

function getRoleTheme(role: string): RoleTheme {
    switch (role) {
        case 'admin':        return { gradient: 'from-[#0B2545] to-[#1D6FA5]', solidBg: 'bg-[#0B2545]', text: 'text-[#0B2545]', hover: 'hover:bg-slate-50',  border: 'hover:border-slate-300', label: 'Admin',        ring: 'ring-slate-300' };
        case 'veterinarian': return { gradient: 'from-[#1D6FA5] to-[#4FA8DA]', solidBg: 'bg-[#1D6FA5]', text: 'text-[#1D6FA5]', hover: 'hover:bg-blue-50',   border: 'hover:border-blue-200',  label: 'Veterinarian', ring: 'ring-blue-200'  };
        default:              return { gradient: 'from-[#4FA8DA] to-[#7FC4EA]', solidBg: 'bg-[#4FA8DA]', text: 'text-[#2E86C1]', hover: 'hover:bg-sky-50',    border: 'hover:border-sky-200',   label: 'Pet Owner',    ring: 'ring-sky-200'   };
    }
}

// ─── Navigation per Role ────────────────────────────────────────────────────

function getNavConfig(role: string): NavConfig {
    switch (role) {

        // ── Pet Owner ────────────────────────────────────────────────────────
        case 'pet_owner': return {
            primary: [
                { title: 'Dashboard',    href: '/owner/dashboard',    icon: LayoutDashboard },
                { title: 'My Pets',      href: '/owner/pets',         icon: PawPrint        },
                { title: 'Appointments', href: '/owner/appointments', icon: CalendarClock   },
                { title: 'Calendar',     href: '/owner/calendar',     icon: CalendarDays    },
            ],
            groups: [
                {
                    label: 'More',
                    icon: MoreHorizontal,
                    items: [
                        { title: 'Health Reminders', href: '/owner/health-reminders', icon: HeartPulse, subtitle: 'Vaccinations & checkups'  },
                        { title: 'Feedback',         href: '/owner/feedback',         icon: Star,       subtitle: 'Rate your visits'         },
                        { title: 'Payments',         href: '/owner/payments',         icon: Wallet,     subtitle: 'Billing & receipts'       },
                        { title: 'Announcements',    href: '/owner/announcements',    icon: Megaphone,  subtitle: 'Clinic news & updates'    },
                        { title: 'Live Chat',        href: '/owner/chat',             icon: MessageSquare, subtitle: 'Talk to the clinic', isChatItem: true },
                    ],
                },
            ],
            notifItem: { title: 'Notifications', href: '/owner/notifications', icon: Bell, isNotification: true },
        };

        // ── Veterinarian ─────────────────────────────────────────────────────
        case 'veterinarian': return {
            primary: [
                { title: 'Dashboard',    href: '/vet/dashboard',    icon: LayoutDashboard },
                { title: 'Appointments', href: '/vet/appointments', icon: CalendarClock   },
                { title: 'Calendar',     href: '/vet/calendar',     icon: CalendarDays    },
                { title: 'Patients',     href: '/vet/patients',     icon: Stethoscope     },
            ],
            groups: [
                {
                    label: 'More',
                    icon: MoreHorizontal,
                    items: [
                        { title: 'Announcements', href: '/vet/announcements', icon: Megaphone, subtitle: 'Clinic news & updates' },
                    ],
                },
            ],
            notifItem: { title: 'Notifications', href: '/vet/notifications', icon: Bell, isNotification: true },
        };

        // ── Admin ─────────────────────────────────────────────────────────────
        case 'admin': return {
            primary: [
                { title: 'Dashboard',    href: '/admin/dashboard',    icon: LayoutDashboard },
                { title: 'Appointments', href: '/admin/appointments', icon: CalendarClock   },
                { title: 'Calendar',     href: '/admin/calendar',     icon: CalendarDays    },
            ],
            groups: [
                {
                    label: 'Accounts',
                    icon: Users,
                    badge: 'pending_approvals',
                    items: [
                        { title: 'Approvals',      href: '/admin/approvals',      icon: UserCheck, subtitle: 'Pending pet owner accounts' },
                        { title: 'Pet Owners',     href: '/admin/pet-owners',     icon: Users,     subtitle: 'Manage owner accounts'      },
                        { title: 'Veterinarians',  href: '/admin/veterinarians',  icon: Stethoscope, subtitle: 'Manage vet accounts'      },
                        { title: 'Pets',           href: '/admin/pets',           icon: PawPrint,  subtitle: 'All registered pets'        },
                    ],
                },
                {
                    label: 'Clinic',
                    icon: ScrollText,
                    items: [
                        { title: 'Announcements', href: '/admin/announcements', icon: Megaphone, subtitle: 'Post clinic-wide news' },
                        { title: 'Feedback',      href: '/admin/feedback',      icon: Star,      subtitle: 'Reviews & ratings'     },
                        { title: 'Payments',      href: '/admin/payments',      icon: Wallet,    subtitle: 'Transactions & revenue' },
                        { title: 'Reports',       href: '/admin/reports',       icon: ScrollText, subtitle: 'Clinic analytics'     },
                        { title: 'Live Chat',     href: '/admin/chat',          icon: MessageSquare, subtitle: 'Support conversations', isChatItem: true },
                    ],
                },
                {
                    label: 'System',
                    icon: ShieldCheck,
                    items: [
                        { title: 'Activity Logs', href: '/admin/activity-logs', icon: ShieldCheck, subtitle: 'Audit trail'       },
                        { title: 'Login Logs',    href: '/admin/login-logs',    icon: Search,      subtitle: 'Login attempt history' },
                    ],
                },
            ],
            notifItem: { title: 'Notifications', href: '/admin/notifications', icon: Bell, isNotification: true },
        };

        default: return { primary: [], groups: [], notifItem: undefined };
    }
}

function getNavigationItems(role: string): NavItem[] {
    const config = getNavConfig(role);
    const all: NavItem[] = [...config.primary];
    for (const group of config.groups) all.push(...group.items);
    if (config.notifItem) all.push(config.notifItem);
    return all;
}

function getProfileHref(role: string): string {
    return { admin: '/profile', veterinarian: '/vet/profile', pet_owner: '/owner/profile' }[role] ?? '/profile';
}
function getNotificationsHref(role: string): string {
    return { admin: '/admin/notifications', veterinarian: '/vet/notifications', pet_owner: '/owner/notifications' }[role] ?? '/owner/notifications';
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function UserAvatar({ user, size = 'md', theme, className = '' }: {
    user: PageProps['auth']['user']; size?: 'sm' | 'md' | 'lg'; theme: RoleTheme; className?: string;
}) {
    const sizeMap = { sm: 'w-7 h-7 text-xs sm:w-8 sm:h-8 sm:text-sm', md: 'w-9 h-9 text-sm sm:w-10 sm:h-10 sm:text-base', lg: 'w-11 h-11 text-base sm:w-12 sm:h-12 sm:text-lg' };
    const cls = `${sizeMap[size]} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${className}`;
    if (user?.profile_photo_url)
        return <img src={user.profile_photo_url} alt={getUserInitials(user)} className={`${cls} object-cover`} />;
    return <div className={`${cls} bg-gradient-to-br ${theme.gradient} text-white`}>{getUserInitials(user)}</div>;
}

const ClinicLogo = () => (
    <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
        <img src="/logo.png" alt="NE Veterinary Clinic"
            className="h-9 w-auto sm:h-11 md:h-12 object-contain group-hover:scale-105 transition-transform duration-200" />
        <span className="hidden sm:inline font-black text-[15px] text-[#0F3C2D] tracking-tight">NE Veterinary Clinic</span>
    </Link>
);

// ─── Unread badge ─────────────────────────────────────────────────────────────

function UnreadBadge({ count, pulse = false, className = '' }: { count: number; pulse?: boolean; className?: string }) {
    if (count <= 0) return null;
    return (
        <span
            className={`inline-flex items-center justify-center rounded-full bg-red-500 text-white font-black leading-none ring-2 ring-white ${pulse ? 'animate-bounce' : ''} ${className}`}
            style={{ minWidth: '1.1rem', height: '1.1rem', fontSize: '9px', padding: '0 3px' }}
        >
            {count > 99 ? '99+' : count > 9 ? '9+' : count}
        </span>
    );
}

function normalizeNotifications(items: ClinicNotification[]): ClinicNotification[] {
    return items.map(item => ({ ...item, is_read: item.is_read === true }));
}

// ─── Navigation Progress Bar ──────────────────────────────────────────────────

function NavigationProgressBar({ color }: { color: string }) {
    const [progress, setProgress] = useState(0);
    const [visible,  setVisible]  = useState(false);
    const [complete, setComplete] = useState(false);
    const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fakeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const clear = () => {
        if (timerRef.current)  clearTimeout(timerRef.current);
        if (fakeTimer.current) clearInterval(fakeTimer.current);
    };

    useEffect(() => {
        const startHandler = router.on('start', () => {
            clear(); setComplete(false); setProgress(0); setVisible(true);
            let pct = 5;
            fakeTimer.current = setInterval(() => {
                pct += Math.random() * 12;
                if (pct >= 85) { pct = 85; clearInterval(fakeTimer.current!); }
                setProgress(pct);
            }, 180);
        });
        const finishHandler = router.on('finish', () => {
            clear(); setProgress(100); setComplete(true);
            timerRef.current = setTimeout(() => { setVisible(false); setProgress(0); setComplete(false); }, 420);
        });
        const errorHandler = router.on('error', () => { clear(); setVisible(false); setProgress(0); });
        return () => { startHandler(); finishHandler(); errorHandler(); clear(); };
    }, []);

    if (!visible) return null;
    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <div style={{
                height: '100%', width: `${progress}%`, background: color,
                transition: complete ? 'width 0.18s ease-out, opacity 0.3s ease 0.12s' : 'width 0.22s ease-out',
                boxShadow: `0 0 10px ${color}88`, borderRadius: '0 2px 2px 0',
            }} />
        </div>
    );
}

// ─── Nav link renderers ────────────────────────────────────────────────────────

function NavLink({
    item, isActive, theme, hasUnread, liveCount, chatUnread, onClick,
}: {
    item: NavItem; isActive: boolean; theme: RoleTheme;
    hasUnread: boolean; liveCount: number; chatUnread: number; onClick: () => void;
}) {
    return (
        <Link
            href={item.href}
            preserveScroll
            onClick={onClick}
            className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-lg font-semibold text-[12px] xl:text-[13px] transition-all duration-150 whitespace-nowrap ${
                isActive
                    ? `${theme.solidBg} text-white shadow-sm`
                    : `text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 border border-transparent ${theme.border}`
            }`}
        >
            <item.icon className="w-[14px] h-[14px] xl:w-[15px] xl:h-[15px] flex-shrink-0" />
            <span className="hidden xl:inline">{item.title}</span>
            {item.isNotification && hasUnread && <UnreadBadge count={liveCount} className="ml-0.5" />}
            {item.isChatItem && chatUnread > 0 && <UnreadBadge count={chatUnread} className="ml-0.5" />}
            {item.badgeCount != null && item.badgeCount > 0 && !item.isNotification && !item.isChatItem && (
                <UnreadBadge count={item.badgeCount} className="ml-0.5" />
            )}
        </Link>
    );
}

function MobileNavLink({
    item, theme, hasUnread, liveCount, chatUnread, onClick,
}: {
    item: NavItem & { subtitle?: string }; theme: RoleTheme;
    hasUnread: boolean; liveCount: number; chatUnread: number; onClick: () => void;
}) {
    const isAct = isActiveRoute(item.href, window.location.pathname);
    return (
        <Link href={item.href} preserveScroll onClick={onClick}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                isAct ? `bg-gradient-to-r ${theme.gradient} text-white shadow-sm` : 'text-gray-700 hover:bg-gray-50'
            }`}>
            <item.icon className="w-5 h-5 flex-shrink-0 opacity-80" />
            <span className="flex-1">{item.title}</span>
            {item.isNotification && hasUnread && <UnreadBadge count={liveCount} />}
            {item.isChatItem && chatUnread > 0 && <UnreadBadge count={chatUnread} />}
            {item.badgeCount != null && item.badgeCount > 0 && !item.isNotification && !item.isChatItem && (
                <UnreadBadge count={item.badgeCount} />
            )}
        </Link>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

function AppHeader() {
    const { auth, unreadNotifications = [] } = usePage<PageProps>().props;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen,   setUserMenuOpen]   = useState(false);
    const [notifOpen,      setNotifOpen]      = useState(false);
    const [scrolled,       setScrolled]       = useState(false);
    const [openGroup,      setOpenGroup]      = useState<string | null>(null);

    const isAuthenticated = !!auth?.user;
    const userName  = getUserDisplayName(auth?.user);
    const userEmail = auth?.user?.email ?? '';
    const userRole  = auth?.user?.role  ?? 'pet_owner';

    const theme    = getRoleTheme(userRole);
    const navConfig = getNavConfig(userRole);

    const progressColor = { admin: '#0B2545', veterinarian: '#1D6FA5' }[userRole] ?? '#4FA8DA';

    const userMenuRef = useRef<HTMLDivElement>(null);
    const notifRef    = useRef<HTMLDivElement>(null);
    const groupNavRef  = useRef<HTMLDivElement>(null);

    // ── Pending approvals badge (Admin only) ──────────────────────────────────
    const [pendingApprovals, setPendingApprovals] = useState(0);

    const fetchPendingApprovals = useCallback(async () => {
        if (userRole !== 'admin') return;
        try {
            const res = await csrfGet('/api/users?role=pet_owner&approval_status=pending&per_page=1');
            if (!res.ok) return;
            const json = await res.json();
            if (json.success) setPendingApprovals(json.pagination?.total ?? 0);
        } catch { /* silent */ }
    }, [userRole]);

    useEffect(() => {
        if (userRole !== 'admin') return;
        fetchPendingApprovals();
        const interval = setInterval(fetchPendingApprovals, 60_000);
        return () => clearInterval(interval);
    }, [fetchPendingApprovals]);

    // ── Pending appointments badge (Admin only) ──────────────────────────────
    const [pendingAppointments, setPendingAppointments] = useState(0);

    const fetchPendingAppointments = useCallback(async () => {
        if (userRole !== 'admin') return;
        try {
            const res = await csrfGet('/api/appointments?status=pending&per_page=1');
            if (!res.ok) return;
            const json = await res.json();
            if (json.success) setPendingAppointments(json.pagination?.total ?? 0);
        } catch { /* silent */ }
    }, [userRole]);

    useEffect(() => {
        if (userRole !== 'admin') return;
        fetchPendingAppointments();
        const interval = setInterval(fetchPendingAppointments, 30_000);
        return () => clearInterval(interval);
    }, [fetchPendingAppointments]);

    // ── Live notification state ───────────────────────────────────────────────
    const seedItems = normalizeNotifications(unreadNotifications as ClinicNotification[]);
    const [liveCount, setLiveCount] = useState<number>(seedItems.length);
    const [liveItems, setLiveItems] = useState<ClinicNotification[]>(seedItems);
    const [pulse, setPulse] = useState(false);
    const prevCount = useRef<number>(seedItems.length);

    useEffect(() => {
        const fresh = normalizeNotifications(unreadNotifications as ClinicNotification[]);
        if (fresh.length > prevCount.current) { setPulse(true); setTimeout(() => setPulse(false), 1400); }
        prevCount.current = fresh.length;
        setLiveCount(fresh.length);
        setLiveItems(fresh);
    }, [unreadNotifications]);

    const fetchUnread = useCallback(async () => {
        try {
            const res = await csrfGet('/api/notifications/unread-count');
            if (!res.ok) return;
            const json = await res.json();
            if (!json.success) return;
            const newCount = json.count as number ?? 0;
            if (newCount > prevCount.current) { setPulse(true); setTimeout(() => setPulse(false), 1400); }
            prevCount.current = newCount;
            setLiveCount(newCount);
        } catch { /* silent */ }
    }, []);

    const fetchLatestNotifications = useCallback(async () => {
        try {
            const res = await csrfGet('/api/notifications?status=unread&per_page=5');
            if (!res.ok) return;
            const json = await res.json();
            if (json.success) setLiveItems(normalizeNotifications(json.data ?? []));
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchUnread();
        const interval = setInterval(fetchUnread, 15_000);
        const onFocus      = () => fetchUnread();
        const onVisibility = () => { if (!document.hidden) fetchUnread(); };
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);
        return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onVisibility); };
    }, [fetchUnread]);

    const hasUnread = liveCount > 0;

    // ── Live chat unread (Pet Owner & Admin only) ─────────────────────────────
    const showChat = userRole === 'pet_owner' || userRole === 'admin';
    const [chatUnread, setChatUnread] = useState(0);

    const fetchChatUnread = useCallback(async () => {
        if (!showChat) return;
        try {
            const qs  = userRole === 'admin' ? 'status=open&per_page=20' : 'per_page=5';
            const res = await csrfGet(`/api/chat/conversations?${qs}`);
            if (!res.ok) return;
            const json = await res.json();
            if (json.success) {
                const total = (json.data ?? []).reduce((sum: number, c: { unread_count?: number }) => sum + (c.unread_count ?? 0), 0);
                setChatUnread(total);
            }
        } catch { /* silent */ }
    }, [showChat, userRole]);

    useEffect(() => {
        fetchChatUnread();
        const interval = setInterval(fetchChatUnread, 30_000);
        return () => clearInterval(interval);
    }, [fetchChatUnread]);

    // ── Close dropdowns on outside click ──────────────────────────────────────
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
            if (groupNavRef.current && !groupNavRef.current.contains(e.target as Node)) setOpenGroup(null);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const closeAll = () => { setMobileMenuOpen(false); setUserMenuOpen(false); setNotifOpen(false); setOpenGroup(null); };

    const handleLogout = () => {
        router.post('/logout', {}, { onFinish: () => closeAll() });
    };

    const handleOpenNotif = () => {
        const next = !notifOpen;
        setNotifOpen(next);
        setUserMenuOpen(false);
        if (next) fetchLatestNotifications();
    };

    const markNotifRead = async (id: number) => {
        try {
            await csrfPost(`/api/notifications/${id}/mark-read`, {});
            setLiveItems(items => items.filter(i => i.id !== id));
            setLiveCount(c => Math.max(0, c - 1));
        } catch { /* silent */ }
    };

    if (!isAuthenticated) return null;

    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <>
            <NavigationProgressBar color={progressColor} />

            <header className={`sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b transition-shadow ${scrolled ? 'shadow-sm border-gray-200' : 'border-gray-100'}`}>
                <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                            <ClinicLogo />

                            {/* Desktop nav */}
                            <nav className="hidden lg:flex items-center gap-1">
                                {navConfig.primary.map((item, i) => {
                                    const navItem = userRole === 'admin' && item.title === 'Appointments'
                                        ? { ...item, badgeCount: pendingAppointments }
                                        : item;
                                    return (
                                        <NavLink key={i} item={navItem} isActive={isActiveRoute(item.href, pathname)} theme={theme}
                                            hasUnread={hasUnread} liveCount={liveCount} chatUnread={chatUnread} onClick={closeAll} />
                                    );
                                })}

                                {navConfig.groups.map((group, gi) => (
                                    <div key={gi} className="relative" ref={openGroup === group.label ? groupNavRef : undefined}>
                                        <button
                                            onClick={() => setOpenGroup(g => g === group.label ? null : group.label)}
                                            className={`relative flex items-center gap-1 px-2.5 py-2 rounded-lg font-semibold text-[12px] xl:text-[13px] transition-all ${
                                                openGroup === group.label ? 'bg-gray-100 text-gray-900' : `text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 border border-transparent ${theme.border}`
                                            }`}
                                        >
                                            <group.icon className="w-[14px] h-[14px] xl:w-[15px] xl:h-[15px]" />
                                            <span className="hidden xl:inline">{group.label}</span>
                                            <ChevronDown className={`w-3 h-3 transition-transform ${openGroup === group.label ? 'rotate-180' : ''}`} />
                                            {group.badge === 'pending_approvals' && pendingApprovals > 0 && (
                                                <UnreadBadge count={pendingApprovals} className="ml-0.5" />
                                            )}
                                        </button>

                                        {openGroup === group.label && (
                                            <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-40" style={{ animation: 'dropIn 0.15s ease-out' }}>
                                                {group.items.map((item, ii) => (
                                                    <Link key={ii} href={item.href} preserveScroll onClick={closeAll}
                                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                                                        <item.icon className={`w-4 h-4 ${theme.text} flex-shrink-0`} />
                                                        <div className="min-w-0">
                                                            <p className="text-[13px] font-semibold text-gray-800 truncate">{item.title}</p>
                                                            {item.subtitle && <p className="text-[11px] text-gray-400 truncate">{item.subtitle}</p>}
                                                        </div>
                                                        {item.isChatItem && chatUnread > 0 && <UnreadBadge count={chatUnread} className="ml-auto" />}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </nav>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Notifications */}
                            {navConfig.notifItem && (
                                <div className="relative" ref={notifRef}>
                                    <button onClick={handleOpenNotif}
                                        className={`relative p-1.5 sm:p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors ${notifOpen ? 'bg-gray-100' : ''}`}>
                                        <Bell className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                        {hasUnread && <UnreadBadge count={liveCount} pulse={pulse} className="absolute -top-0.5 -right-0.5" />}
                                    </button>

                                    {notifOpen && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-40" style={{ animation: 'dropIn 0.15s ease-out' }}>
                                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                                <p className="text-sm font-bold text-gray-800">Notifications</p>
                                                <Link href={getNotificationsHref(userRole)} onClick={closeAll} className={`text-[11px] font-semibold ${theme.text}`}>View all</Link>
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {liveItems.length === 0 ? (
                                                    <p className="px-4 py-6 text-center text-xs text-gray-400">You're all caught up.</p>
                                                ) : liveItems.map(n => (
                                                    <button key={n.id} onClick={() => markNotifRead(n.id)}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                                                        <p className="text-[13px] font-semibold text-gray-800 truncate">{n.title ?? 'Notification'}</p>
                                                        <p className="text-[12px] text-gray-500 line-clamp-2">{n.message}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* User menu */}
                            <div className="relative" ref={userMenuRef}>
                                <button onClick={() => { setUserMenuOpen(v => !v); setNotifOpen(false); }}
                                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition-colors">
                                    <UserAvatar user={auth?.user} size="sm" theme={theme} />
                                    <span className="hidden sm:block text-left">
                                        <span className="block text-[12px] font-bold text-gray-800 leading-tight max-w-[120px] truncate">{userName}</span>
                                        <span className={`block text-[10px] font-semibold ${theme.text}`}>{getRoleLabel(userRole)}</span>
                                    </span>
                                    <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-40" style={{ animation: 'dropIn 0.15s ease-out' }}>
                                        <div className={`bg-gradient-to-br ${theme.gradient} px-4 py-3.5`}>
                                            <div className="flex items-center gap-3">
                                                <UserAvatar user={auth?.user} size="md" theme={theme} className="border-2 border-white/40" />
                                                <div className="min-w-0">
                                                    <p className="text-white font-bold text-sm truncate">{userName}</p>
                                                    <p className="text-white/80 text-[11px] truncate">{userEmail}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="py-1.5">
                                            <Link href={getProfileHref(userRole)} preserveScroll onClick={closeAll}
                                                className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                                <User className={`w-4 h-4 ${theme.text}`} />My Profile
                                            </Link>
                                            <button onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-[13px] font-bold">
                                                <LogOut className="w-4 h-4" />Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile toggle */}
                            <button
                                onClick={() => { setMobileMenuOpen(v => !v); setUserMenuOpen(false); setNotifOpen(false); }}
                                className={`lg:hidden relative p-1.5 sm:p-2 rounded-lg bg-white border border-gray-200 text-gray-600 ${theme.border} hover:shadow-sm transition-all`}
                            >
                                {mobileMenuOpen ? <X className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> : <Menu className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
                                {!mobileMenuOpen && hasUnread && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Mobile overlay ── */}
            {mobileMenuOpen && <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setMobileMenuOpen(false)} />}

            {/* ── Mobile sidebar ── */}
            <div className={`lg:hidden fixed top-0 right-0 h-full w-[280px] sm:w-[320px] bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                    <button onClick={() => setMobileMenuOpen(false)} className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>

                    {/* Profile card */}
                    <div className={`bg-gradient-to-br ${theme.gradient} rounded-xl p-3 sm:p-4 mt-6 sm:mt-8 shadow-md`}>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <UserAvatar user={auth?.user} size="md" theme={theme} className="border-2 border-white/40" />
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-sm truncate">{userName}</p>
                                <p className="text-white/80 text-xs truncate">{userEmail}</p>
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                    <span className="px-1.5 sm:px-2 py-0.5 bg-white/25 text-white text-[10px] sm:text-xs font-bold rounded-full border border-white/40">
                                        {getRoleLabel(userRole)}
                                    </span>
                                    {hasUnread && <span className="px-1.5 sm:px-2 py-0.5 bg-red-500/80 text-white text-[10px] font-black rounded-full">{liveCount} unread</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nav items */}
                    <div className="space-y-1">
                        <div className="space-y-0.5">
                            {navConfig.primary.map((item, i) => {
                                const navItem = userRole === 'admin' && item.title === 'Appointments'
                                    ? { ...item, badgeCount: pendingAppointments }
                                    : item;
                                return (
                                    <MobileNavLink key={i} item={navItem} theme={theme}
                                        hasUnread={hasUnread} liveCount={liveCount} chatUnread={chatUnread} onClick={closeAll} />
                                );
                            })}
                        </div>
                        {navConfig.groups.map((group, gi) => (
                            <div key={gi} className="pt-2">
                                <div className="flex items-center gap-2 px-4 py-1.5">
                                    <group.icon className={`w-3 h-3 ${theme.text}`} />
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${theme.text} opacity-70`}>{group.label}</p>
                                    {group.badge === 'pending_approvals' && pendingApprovals > 0 && (
                                        <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded-full">{pendingApprovals} pending</span>
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    {group.items.map((item, ii) => (
                                        <MobileNavLink key={ii} item={item} theme={theme}
                                            hasUnread={hasUnread} liveCount={liveCount} chatUnread={chatUnread} onClick={closeAll} />
                                    ))}
                                </div>
                            </div>
                        ))}
                        {navConfig.notifItem && (
                            <div className="pt-2">
                                <MobileNavLink item={navConfig.notifItem} theme={theme}
                                    hasUnread={hasUnread} liveCount={liveCount} chatUnread={chatUnread} onClick={closeAll} />
                            </div>
                        )}
                    </div>

                    {/* Bottom actions */}
                    <div className="pt-3 border-t border-gray-100 space-y-0.5">
                        <Link href={getProfileHref(userRole)} preserveScroll onClick={closeAll}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 ${theme.hover} transition-colors`}>
                            <User className={`w-5 h-5 ${theme.text}`} />My Profile
                        </Link>
                        <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-sm transition-colors bg-red-50 text-red-600 hover:bg-red-100">
                            <LogOut className="w-5 h-5" />
                            <span className="flex-1">Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes dropIn {
                    from { opacity: 0; transform: translateY(-6px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </>
    );
}

export { AppHeader };
export default AppHeader;
