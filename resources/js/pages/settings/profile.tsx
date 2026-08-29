import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { User, Mail, Check, AlertCircle, Shield, Trash2 } from 'lucide-react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: '/settings/profile',
    },
];

type ProfileForm = {
    name: string;
    email: string;
}

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm<Required<ProfileForm>>({
        name: auth.user.name,
        email: auth.user.email,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-8">
                    {/* Profile Information Section */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <User className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Profile Information</h2>
                                    <p className="text-blue-100 text-sm">Update your account details</p>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={submit} className="p-6 space-y-6">
                            {/* User Info Card */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-100 rounded-full">
                                        <User className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Current User</p>
                                        <p className="text-lg font-bold text-gray-900">{auth.user.name}</p>
                                        <p className="text-sm text-gray-600">{auth.user.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Name Field */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                    Full Name
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="name"
                                        className="pl-10 py-3 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        autoComplete="name"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <InputError message={errors.name} />
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        className="pl-10 py-3 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        autoComplete="username"
                                        placeholder="your.email@example.com"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            {/* Email Verification Notice */}
                            {mustVerifyEmail && auth.user.email_verified_at === null && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-yellow-800">
                                                Your email address is unverified.
                                            </p>
                                            <p className="text-sm text-yellow-700 mt-1">
                                                <Link
                                                    href={route('verification.send')}
                                                    method="post"
                                                    as="button"
                                                    className="font-semibold underline hover:text-yellow-900"
                                                >
                                                    Click here to resend the verification email.
                                                </Link>
                                            </p>
                                            {status === 'verification-link-sent' && (
                                                <div className="mt-2 flex items-center gap-2 text-green-700">
                                                    <Check className="h-4 w-4" />
                                                    <span className="text-sm font-medium">
                                                        A new verification link has been sent to your email.
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Verified Badge */}
                            {auth.user.email_verified_at && (
                                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-green-100 rounded-full">
                                            <Check className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-green-800">Email Verified</p>
                                            <p className="text-xs text-green-700">
                                                Your email address has been verified on {new Date(auth.user.email_verified_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                                <Button 
                                    disabled={processing}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg"
                                >
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>

                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out duration-300"
                                    enterFrom="opacity-0 translate-x-2"
                                    enterTo="opacity-100 translate-x-0"
                                    leave="transition ease-in-out duration-300"
                                    leaveTo="opacity-0"
                                >
                                    <div className="flex items-center gap-2 text-green-600">
                                        <Check className="h-5 w-5" />
                                        <p className="text-sm font-semibold">Saved successfully!</p>
                                    </div>
                                </Transition>
                            </div>
                        </form>
                    </div>

                    {/* Delete Account Section */}
                    <div className="bg-white rounded-xl border border-red-200 shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 border-b border-red-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Trash2 className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Danger Zone</h2>
                                    <p className="text-red-100 text-sm">Permanently delete your account</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <DeleteUser />
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}