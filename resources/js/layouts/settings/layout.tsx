import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import { User, Lock, Settings } from 'lucide-react';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: '/settings/profile',
        icon: User,
    },
    {
        title: 'Password',
        href: '/settings/password',
        icon: Lock,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg">
                        <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                        <p className="text-gray-600">Manage your profile and account settings</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col space-y-6 lg:flex-row lg:space-y-0 lg:space-x-6">
                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-64">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4">
                        <div className="mb-4">
                            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide px-3">Navigation</h2>
                        </div>
                        <nav className="flex flex-col space-y-1">
                            {sidebarNavItems.map((item, index) => {
                                const Icon = item.icon;
                                const isActive = currentPath === item.href;
                                
                                return (
                                    <Link
                                        key={`${item.href}-${index}`}
                                        href={item.href}
                                        prefetch
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                                            isActive
                                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                        )}
                                    >
                                        {Icon && (
                                            <Icon className={cn(
                                                'h-5 w-5',
                                                isActive ? 'text-white' : 'text-gray-500'
                                            )} />
                                        )}
                                        <span>{item.title}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Quick Info Card */}
                    <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Settings className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Account Settings</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Keep your account secure by regularly updating your password and profile information.
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>

                <Separator className="my-6 lg:hidden" />

                {/* Main Content */}
                <div className="flex-1">
                    <div className="max-w-4xl">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}