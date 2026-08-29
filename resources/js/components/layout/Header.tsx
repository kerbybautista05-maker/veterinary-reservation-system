import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Menu, X, LogIn, CalendarCheck } from 'lucide-react';

interface HeaderProps {
    scrollY: number;
}

export default function Header({ scrollY }: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isScrolled = scrollY > 50;

    const navItems = [
        { name: 'Home', href: '#home' },
        { name: 'Services', href: '#services' },
        { name: 'How It Works', href: '#features' },
        { name: 'Contact', href: '#contact' },
    ];

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [mobileMenuOpen]);

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
            style={isScrolled
                ? { background: '#fff', boxShadow: '0 2px 16px rgba(11,37,69,0.10)', padding: '8px 0' }
                : { background: '#0B2545', padding: '12px 0' }
            }
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-12">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 min-w-0">
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border-2"
                            style={isScrolled
                                ? { background: '#E3F2FD', borderColor: '#BBDEFB' }
                                : { background: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.35)' }
                            }
                        >
                            <img
                                src="/logo.png"
                                alt="NEVET"
                                className="w-9 h-9 object-contain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                        <div className="hidden sm:block leading-tight">
                            <p
                                className="text-[11px] font-black uppercase tracking-wide"
                                style={{ color: isScrolled ? '#0B2545' : '#fff' }}
                            >
                                NE Veterinary Clinic
                            </p>
                            <p
                                className="text-[10px] font-medium"
                                style={{ color: isScrolled ? '#64748b' : 'rgba(187,222,251,1)' }}
                            >
                                Cabanatuan City
                            </p>
                        </div>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                        {navItems.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="text-sm font-semibold transition-colors"
                                style={{ color: isScrolled ? '#374151' : 'rgba(255,255,255,0.9)' }}
                                onMouseEnter={e => (e.currentTarget.style.color = isScrolled ? '#1D6FA5' : '#fff')}
                                onMouseLeave={e => (e.currentTarget.style.color = isScrolled ? '#374151' : 'rgba(255,255,255,0.9)')}
                            >
                                {item.name}
                            </a>
                        ))}
                    </nav>

                    {/* CTA buttons */}
                    <div className="hidden md:flex items-center gap-2">
                        <Link
                            href="/login"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                            style={{ color: isScrolled ? '#1D6FA5' : '#fff' }}
                        >
                            <LogIn className="w-4 h-4" />
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-all"
                            style={isScrolled
                                ? { background: '#1D6FA5', color: '#fff' }
                                : { background: '#fff', color: '#0B2545' }
                            }
                        >
                            <CalendarCheck className="w-4 h-4" />
                            Book Appointment
                        </Link>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg"
                        style={{ color: isScrolled ? '#1D6FA5' : '#fff' }}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu overlay */}
            {mobileMenuOpen && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)} />
                    <div className="fixed top-[72px] right-4 left-4 bg-white rounded-2xl shadow-2xl z-50 p-5 space-y-1"
                        style={{ border: '1px solid #DBEAFE' }}>
                        {navItems.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                                style={{ color: '#0B2545' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {item.name}
                            </a>
                        ))}
                        <div className="pt-3 border-t space-y-2" style={{ borderColor: '#DBEAFE' }}>
                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold border"
                                style={{ color: '#1D6FA5', borderColor: '#BFDBFE' }}
                            >
                                <LogIn className="w-4 h-4" /> Login
                            </Link>
                            <Link
                                href="/register"
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white"
                                style={{ background: '#1D6FA5' }}
                            >
                                <CalendarCheck className="w-4 h-4" /> Book Appointment
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </header>
    );
}
