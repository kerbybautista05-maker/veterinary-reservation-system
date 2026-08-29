import { Link } from '@inertiajs/react';
import { CalendarCheck, ChevronRight, Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function CTASection() {
    return (
        <section id="contact" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

                    {/* LEFT: Contact info */}
                    <div>
                        <span
                            className="inline-block text-[10px] font-black uppercase tracking-[0.22em] px-4 py-1.5 rounded-full mb-5"
                            style={{ background: '#E3F2FD', color: '#1D6FA5' }}
                        >
                            Contact & Location
                        </span>
                        <h2
                            className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight"
                            style={{ fontFamily: "'Georgia', serif" }}
                        >
                            Get In Touch
                        </h2>
                        <p className="text-gray-500 text-base leading-relaxed mb-9 max-w-md">
                            Visit us in Cabanatuan City or reach out through any channel below. We're available during regular clinic hours.
                        </p>

                        {/* Contact cards */}
                        <div className="space-y-4 mb-8">
                            {[
                                { Icon: MapPin, label: 'Address', value: '634 Ortiz Bldg, Sangitan East, Cabanatuan City, 3100 Nueva Ecija' },
                                { Icon: Phone, label: 'Phone', value: '+63 44 940 8350' },
                                { Icon: Mail, label: 'Email', value: 'info@nevet.ph' },
                            ].map(({ Icon, label, value }) => (
                                <div key={label} className="flex items-center gap-4">
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: '#E3F2FD' }}
                                    >
                                        <Icon className="w-5 h-5" style={{ color: '#1D6FA5' }} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                                        <p className="text-sm font-bold text-gray-800">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Clinic hours card */}
                        <div
                            className="flex items-start gap-4 p-4 rounded-xl"
                            style={{ background: '#F0F6FF', borderLeft: '3px solid #1D6FA5' }}
                        >
                            <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: '#DBEAFE' }}
                            >
                                <Clock className="w-4 h-4" style={{ color: '#1D6FA5' }} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Clinic Hours</p>
                                <p className="text-sm font-bold text-gray-800">Mon–Fri: 9:00 AM – 5:30 PM</p>
                                <p className="text-sm text-gray-500">Saturday: 9:00 AM – 4:00 PM · Sunday: Closed</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: CTA card */}
                    <div
                        className="rounded-2xl overflow-hidden shadow-2xl"
                        style={{ background: 'linear-gradient(145deg, #0B2545 0%, #1D6FA5 100%)' }}
                    >
                        <div className="p-10 text-center">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                                style={{ background: 'rgba(255,255,255,0.15)' }}
                            >
                                <CalendarCheck className="w-8 h-8 text-white" />
                            </div>

                            <h3
                                className="text-2xl sm:text-3xl font-black text-white mb-3"
                                style={{ fontFamily: "'Georgia', serif" }}
                            >
                                Ready to get started?
                            </h3>
                            <p className="text-blue-200 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                                Register your pet, book an appointment, and let our licensed veterinarians take care of the rest.
                            </p>

                            <Link
                                href="/register"
                                className="inline-flex items-center gap-2.5 bg-white font-bold px-8 py-3.5 rounded-xl shadow-xl hover:-translate-y-0.5 transition-all text-sm"
                                style={{ color: '#0B2545' }}
                            >
                                Register Now
                                <ChevronRight className="w-4 h-4 opacity-70" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
