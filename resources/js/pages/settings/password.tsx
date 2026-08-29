import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { Lock, Key, Eye, EyeOff, Check, Shield, AlertCircle } from 'lucide-react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Password settings',
        href: '/settings/password',
    },
];

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    // Password strength checker
    const getPasswordStrength = (password: string) => {
        if (!password) return { strength: 0, label: '', color: '' };
        
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        if (strength <= 2) return { strength: 1, label: 'Weak', color: 'bg-red-500' };
        if (strength <= 3) return { strength: 2, label: 'Fair', color: 'bg-yellow-500' };
        if (strength <= 4) return { strength: 3, label: 'Good', color: 'bg-blue-500' };
        return { strength: 4, label: 'Strong', color: 'bg-green-500' };
    };

    const passwordStrength = getPasswordStrength(data.password);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Password settings" />

            <SettingsLayout>
                <div className="space-y-8">
                    {/* Password Update Section */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Lock className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Update Password</h2>
                                    <p className="text-blue-100 text-sm">Ensure your account is using a strong password</p>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={updatePassword} className="p-6 space-y-6">
                            {/* Security Info */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Shield className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">Password Security Tips</p>
                                        <ul className="text-xs text-gray-700 mt-2 space-y-1">
                                            <li>• Use at least 8 characters (12+ recommended)</li>
                                            <li>• Mix uppercase and lowercase letters</li>
                                            <li>• Include numbers and special characters</li>
                                            <li>• Avoid common words or personal information</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Current Password */}
                            <div className="space-y-2">
                                <Label htmlFor="current_password" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Key className="h-4 w-4 text-gray-500" />
                                    Current Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        value={data.current_password}
                                        onChange={(e) => setData('current_password', e.target.value)}
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        className="pl-10 pr-10 py-3 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        autoComplete="current-password"
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                <InputError message={errors.current_password} />
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-gray-500" />
                                    New Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="password"
                                        ref={passwordInput}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        type={showNewPassword ? 'text' : 'password'}
                                        className="pl-10 pr-10 py-3 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        autoComplete="new-password"
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                
                                {/* Password Strength Indicator */}
                                {data.password && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                                    style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-semibold ${
                                                passwordStrength.strength === 1 ? 'text-red-600' :
                                                passwordStrength.strength === 2 ? 'text-yellow-600' :
                                                passwordStrength.strength === 3 ? 'text-blue-600' :
                                                'text-green-600'
                                            }`}>
                                                {passwordStrength.label}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                <InputError message={errors.password} />
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-gray-500" />
                                    Confirm New Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="password_confirmation"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className="pl-10 pr-10 py-3 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        autoComplete="new-password"
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                
                                {/* Password Match Indicator */}
                                {data.password_confirmation && data.password && (
                                    <div className="flex items-center gap-2 text-sm">
                                        {data.password === data.password_confirmation ? (
                                            <>
                                                <Check className="h-4 w-4 text-green-600" />
                                                <span className="text-green-600 font-medium">Passwords match</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="h-4 w-4 text-red-600" />
                                                <span className="text-red-600 font-medium">Passwords do not match</span>
                                            </>
                                        )}
                                    </div>
                                )}
                                
                                <InputError message={errors.password_confirmation} />
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                                <Button 
                                    disabled={processing}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg"
                                >
                                    {processing ? 'Updating...' : 'Update Password'}
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
                                        <p className="text-sm font-semibold">Password updated successfully!</p>
                                    </div>
                                </Transition>
                            </div>
                        </form>
                    </div>

                    {/* Additional Security Info */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-yellow-800">Security Reminder</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    If you suspect your account has been compromised, change your password immediately and contact support.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}