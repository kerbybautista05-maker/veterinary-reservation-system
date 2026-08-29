// ============================================
// FILE: pages/Auth/VerifyEmail.tsx
// Columban College Scheduling System - Verify Email
// ============================================
import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle, Mail, ArrowLeft } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Button } from '@/components/ui/button';

interface VerifyEmailProps {
    status?: string;
}

export default function VerifyEmail({ status }: VerifyEmailProps) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <Head title="Email Verification - Columban College" />

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

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                {/* Back button */}
                <div className="mb-6">
                    <Link 
                        href={route('dashboard')} 
                        className="inline-flex items-center text-base font-semibold text-white/80 hover:text-amber-400 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back to Dashboard
                    </Link>
                </div>

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
                
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 py-10 px-8 shadow-2xl rounded-2xl sm:px-10">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                            <Mail className="w-10 h-10 text-blue-950" />
                        </div>
                    </div>

                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">Verify Your Email</h2>
                        <p className="text-gray-300 text-base leading-relaxed">
                            Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you? If you didn't receive the email, we'll gladly send you another.
                        </p>
                    </div>

                    {status === 'verification-link-sent' && (
                        <div className="mb-6 p-4 bg-green-500 bg-opacity-20 border border-green-400 rounded-xl">
                            <p className="text-green-300 text-sm font-medium text-center">
                                A new verification link has been sent to your email address.
                            </p>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <Button 
                            type="submit" 
                            className="w-full bg-amber-500 hover:bg-amber-600 text-blue-950 font-bold py-3 text-base rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center" 
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <LoaderCircle className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                    Sending...
                                </>
                            ) : (
                                'Resend Verification Email'
                            )}
                        </Button>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="w-full inline-flex items-center justify-center px-6 py-3 text-white/80 hover:text-white font-medium text-base rounded-xl transition-colors hover:bg-white/5"
                        >
                            Log Out
                        </Link>
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