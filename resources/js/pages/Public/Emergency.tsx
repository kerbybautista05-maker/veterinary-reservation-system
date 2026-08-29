import { Head, Link } from '@inertiajs/react';
import { Phone, MapPin, Clock, AlertTriangle, ArrowRight, Heart } from 'lucide-react';

export default function Emergency() {
    return (
        <div className="min-h-screen bg-white">
            <Head title="Emergency — NE Veterinary Clinic" />

            {/* Urgent banner */}
            <div className="w-full py-3 text-center text-white text-sm font-bold" style={{ background: '#DC2626' }}>
                <AlertTriangle className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                If your pet is in critical condition, call immediately or go to the nearest vet
            </div>

            <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">

                {/* Call button — biggest element */}
                <div className="mb-10">
                    <a
                        href="tel:+63449408350"
                        className="flex items-center justify-center gap-3 w-full py-5 rounded-2xl text-white text-xl font-black shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                        style={{ background: '#DC2626' }}
                    >
                        <Phone className="w-6 h-6" />
                        Call Now: +63 44 940 8350
                    </a>
                    <p className="text-center text-xs text-gray-400 mt-2">Tap to call directly</p>
                </div>

                {/* Emergency signs */}
                <div className="mb-10">
                    <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide mb-4">
                        Go to the vet IMMEDIATELY if your pet has:
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                            'Difficulty breathing',
                            'Severe bleeding',
                            'Seizures or collapse',
                            'Vomiting blood',
                            'Inability to urinate',
                            'Heatstroke / overheating',
                            'Poisoning or toxin ingestion',
                            'Severe trauma (hit by car, fall)',
                            'Swollen abdomen / bloating',
                            'Eye injury',
                        ].map(sign => (
                            <div key={sign} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                                <Heart className="w-3 h-3 text-red-500 shrink-0" />
                                <span className="text-sm text-gray-700">{sign}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Clinic info */}
                <div className="mb-10 space-y-3">
                    <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide mb-4">
                        N.E. Veterinary Clinic
                    </h2>

                    <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100">
                        <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-gray-800">Address</p>
                            <p className="text-sm text-gray-500">634 Ortiz Bldg, Sangitan East, Cabanatuan City, 3100 Nueva Ecija</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100">
                        <Phone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-gray-800">Phone</p>
                            <a href="tel:+63449408350" className="text-sm text-blue-600 font-bold">+63 44 940 8350</a>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100">
                        <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-gray-800">Clinic Hours</p>
                            <p className="text-sm text-gray-500">Mon–Fri: 9:00 AM – 5:30 PM</p>
                            <p className="text-sm text-gray-500">Saturday: 9:00 AM – 4:00 PM</p>
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div className="mb-10">
                    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3844.8624295889535!2d120.97303117490426!3d15.491830285107097!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x339729273faeb00b%3A0xc56ec43ef6076974!2sN.E.%20Veterinary%20Clinic!5e0!3m2!1sen!2sph!4v1784688906950!5m2!1sen!2sph"
                            width="100%"
                            height="300"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            title="N.E. Veterinary Clinic Location"
                        />
                    </div>
                </div>

                {/* Get directions */}
                <a
                    href="https://www.google.com/maps/dir/?api=1&destination=N.E.+Veterinary+Clinic+Cabanatuan+City"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all mb-6"
                    style={{ background: '#0B2545' }}
                >
                    <MapPin className="w-4 h-4" />
                    Get Directions via Google Maps
                    <ArrowRight className="w-4 h-4" />
                </a>

                {/* Back to home */}
                <div className="text-center">
                    <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                        ← Back to NE Veterinary Clinic
                    </Link>
                </div>
            </div>
        </div>
    );
}
