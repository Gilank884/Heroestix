import React from "react";
import { Link } from "react-router-dom";
import {
    Facebook,
    Twitter,
    Instagram,
    Mail,
    Phone,
    MapPin,
    ArrowRight
} from "lucide-react";

export default function BottomBar() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-950 text-white pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
                {/* Column 1: Brand Info */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <img
                                src="/Logo/Logo.png"
                                alt="Heroestix Logo"
                                className="h-6 w-auto brightness-0 invert"
                            />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white transition-colors duration-300">
                            Heroestix
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                        Platform ticketing modern yang dirancang untuk menghadirkan pengalaman pemesanan tiket yang mulus, aman, dan berkelas bagi setiap pecinta event.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 transition-all duration-300 group">
                            <Facebook size={18} className="text-slate-400 group-hover:text-white" />
                        </a>
                        <a href="#" className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 transition-all duration-300 group">
                            <Twitter size={18} className="text-slate-400 group-hover:text-white" />
                        </a>
                        <a href="#" className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 transition-all duration-300 group">
                            <Instagram size={18} className="text-slate-400 group-hover:text-white" />
                        </a>
                    </div>
                </div>

                {/* Column 2: Discover */}
                <div>
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white mb-8">Discover</h4>
                    <ul className="space-y-4 text-slate-400 text-sm font-medium">
                        <li><Link to="/" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" /> Beranda</Link></li>
                        <li><Link to="/#events" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" /> Cari Event</Link></li>
                        <li><Link to="/become-creator" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" /> Jadi Kolaborator</Link></li>
                        <li><Link to="/about-us" className="hover:text-blue-400 transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" /> Tentang Kami</Link></li>
                    </ul>
                </div>

                {/* Column 3: Dukungan */}
                <div>
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white mb-8">Dukungan</h4>
                    <ul className="space-y-4 text-slate-400 text-sm font-medium">
                        <li><a href="#" className="hover:text-blue-400 transition-colors">Syarat & Ketentuan</a></li>
                        <li><a href="#" className="hover:text-blue-400 transition-colors">Kebijakan Privasi</a></li>
                        <li><a href="#" className="hover:text-blue-400 transition-colors">Kebijakan Merchant</a></li>
                        <li><a href="#" className="hover:text-blue-400 transition-colors">Pusat Bantuan</a></li>
                    </ul>
                </div>

                {/* Column 4: Hubungi Kami */}
                <div>
                    <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white mb-8">Hubungi Kami</h4>
                    <ul className="space-y-6 text-slate-400 text-sm font-medium">
                        <li className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <Mail size={18} />
                            </div>
                            <span>support@heroestix.com</span>
                        </li>
                        <li className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <Phone size={18} />
                            </div>
                            <span>+62 (21) 1234 5678</span>
                        </li>
                        <li className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <MapPin size={18} />
                            </div>
                            <span>Jakarta, Indonesia</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-24 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-slate-500 text-xs font-medium">
                    &copy; {currentYear} Heroestix Platform. Empowering events globally.
                </p>
                <div className="flex gap-8 text-[10px] uppercase font-bold tracking-widest text-slate-600">
                    <a href="#" className="hover:text-blue-500 transition-colors">Terms</a>
                    <a href="#" className="hover:text-blue-500 transition-colors">Privacy</a>
                    <a href="#" className="hover:text-blue-500 transition-colors">Cookies</a>
                </div>
            </div>
        </footer>
    );
}

