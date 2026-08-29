import { Link } from '@inertiajs/react';
import { Mail, Phone, MapPin, Clock, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer
            className="text-white"
            style={{ background: 'linear-gradient(160deg, #0B2545 0%, #1D6FA5 50%, #0D47A1 100%)' }}
        >
            {/* Top wave */}
            <div className="leading-none" style={{ background: '#F0F6FF' }}>
                <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none" className="w-full block">
                    <path d="M0 24C360 48 1080 0 1440 24V48H0V24Z" fill="#0B2545" />
                </svg>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-3 mb-5">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)' }}
                            >
                                <img
                                    src="/logo.png"
                                    alt="NEVET Logo"
                                    className="w-9 h-9 object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="color:#fff;font-weight:900;font-size:11px;">NE</span>';
                                    }}
                                />
                            </div>
                            <div>
                                <p className="text-white text-xs font-black leading-tight uppercase tracking-wide">NE Veterinary</p>
                                <p className="text-blue-200 text-[11px]">Clinic</p>
                            </div>
                        </div>
                        <p className="text-blue-200 text-sm leading-relaxed">
                            Compassionate, professional pet care in Cabanatuan City, Nueva Ecija.
                            Proudly serving families and their beloved companions since 2009.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-[11px] font-black text-white mb-5 uppercase tracking-[0.2em]">Quick Links</h4>
                        <ul className="space-y-2.5">
                            {[
                                { label: 'Home', href: '#home' },
                                { label: 'Services', href: '#services' },
                                { label: 'How It Works', href: '#features' },
                                { label: 'Contact', href: '#contact' },
                            ].map(item => (
                                <li key={item.label}>
                                    <a
                                        href={item.href}
                                        className="text-blue-200 hover:text-white transition-colors text-sm"
                                    >
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                            <li>
                                <Link href="/login" className="text-blue-200 hover:text-white transition-colors text-sm">
                                    Client Login
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="text-[11px] font-black text-white mb-5 uppercase tracking-[0.2em]">Our Services</h4>
                        <ul className="space-y-2.5">
                            {[
                                'Wellness Exams',
                                'Vaccinations',
                                'Surgery',
                                'Dental Care',
                                'Emergency Care',
                            ].map(label => (
                                <li key={label} className="text-blue-200 text-sm">{label}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-[11px] font-black text-white mb-5 uppercase tracking-[0.2em]">Contact Us</h4>
                        <ul className="space-y-4 mb-6">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#90CAF9' }} />
                                <span className="text-blue-200 text-sm">634 Ortiz Bldg, Sangitan East, Cabanatuan City, Nueva Ecija</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-4 h-4 flex-shrink-0" style={{ color: '#90CAF9' }} />
                                <span className="text-blue-200 text-sm">+63 44 940 8350</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#90CAF9' }} />
                                <span className="text-blue-200 text-sm">info@nevet.ph</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#90CAF9' }} />
                                <span className="text-blue-200 text-sm">Mon–Fri: 9AM–5:30PM</span>
                            </li>
                        </ul>

                        {/* Socials */}
                        <div className="flex gap-2">
                            <a
                                href="#"
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5"
                                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
                                aria-label="Facebook"
                            >
                                <Facebook className="w-4 h-4 text-blue-200" />
                            </a>
                            <a
                                href="#"
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5"
                                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
                                aria-label="Instagram"
                            >
                                <Instagram className="w-4 h-4 text-blue-200" />
                            </a>
                            <a
                                href="tel:+63449408350"
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5"
                                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
                                aria-label="Call Us"
                            >
                                <Phone className="w-4 h-4 text-blue-200" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                    <p className="text-blue-300 text-sm">
                        &copy; {currentYear} NE Veterinary Clinic &middot; Cabanatuan City, Nueva Ecija. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="/login" className="text-blue-300 hover:text-white text-sm transition-colors">
                            Client Login
                        </Link>
                        <Link href="/register" className="text-blue-300 hover:text-white text-sm transition-colors">
                            Register
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
