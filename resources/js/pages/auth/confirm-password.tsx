// ============================================
// FILE: pages/Auth/ConfirmPassword.tsx
// Columban College Scheduling System - Confirm Password
// ============================================
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff, Shield } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ConfirmPassword() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<Required<{ password: string }>>({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center px-4 relative overflow-hidden">
            <Head title="Confirm Password - Columban College" />

            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
                <div className="absolute inset-0 opacity-5">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo and College Info */}
                <div className="text-center mb-8">
                    <img
                        src="/logo.png"
                        alt="Columban College Logo"
                        className="mx-auto w-20 h-20 mb-4 object-contain"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <h1 className="text-2xl font-bold text-white mb-2">
                        COLUMBAN COLLEGE, INC.
                    </h1>
                    <p className="text-amber-400 text-sm font-medium italic">
                        Scheduling System
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                            <Shield className="w-8 h-8 text-blue-950" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-white text-center mb-3">
                        Confirm Your Password
                    </h2>
                    <p className="text-gray-300 text-center mb-6 text-sm">
                        This is a secure area of the application. Please confirm your password before continuing.
                    </p>

                    <form onSubmit={submit}>
                        <div className="space-y-6">
                            <div>
                                <Label htmlFor="password" className="text-white/90 font-medium mb-2 block">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        value={data.password}
                                        autoFocus
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full rounded-xl bg-white/90 text-gray-900 border-0 placeholder:text-gray-500 focus:ring-2 focus:ring-amber-400 px-4 py-3 pr-12"
                                    />
                                    <button 
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-600 hover:text-gray-800 focus:outline-none"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" aria-hidden="true" />
                                        ) : (
                                            <Eye className="h-5 w-5" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="text-red-300 mt-1" />
                            </div>

                            <Button 
                                className="w-full bg-amber-500 hover:bg-amber-600 text-blue-950 font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center" 
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <LoaderCircle className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                        Confirming...
                                    </>
                                ) : (
                                    'Confirm Password'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.2; transform: scale(1.05); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 6s ease-in-out infinite;
                }
                .animation-delay-2000 { animation-delay: 2s; }
            `}</style>
        </div>
    );
}