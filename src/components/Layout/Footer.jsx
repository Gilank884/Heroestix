import React from "react";
import { Link } from "react-router-dom";
import {
    Instagram,
    MessageCircle, // For WhatsApp
    MapPin,
    Mail,
    Phone
} from "lucide-react";

export default function BottomBar() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-950 pt-20 pb-10 relative overflow-hidden">
            {/* Decoration Background - Subtle & Clean */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-600/50 to-transparent"></div>
            <div className="absolute -top-[100px] -right-[100px] w-[300px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-16 mb-16">
                    {/* 1. BRAND & DESCRIPTION (Col-span-4) */}
                    <div className="lg:col-span-4 space-y-6">
                        <Link to="/" className="flex items-center gap-3 group w-fit">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform duration-300">
                                <img
                                    src="/Logo/Logo.png"
                                    alt="Heroestix"
                                    className="h-6 w-auto brightness-0 invert"
                                />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-white group-hover:text-blue-500 transition-colors">
                                Heroestix
                            </span>
                        </Link>
                        <p className="text-slate-400 leading-relaxed font-medium text-sm">
                            Platform tiket event terpercaya untuk komunitas. Temukan, buat, dan rayakan momen terbaikmu bersama kami.
                        </p>
                    </div>

                    {/* 2. MENU (Col-span-2) */}
                    <div className="lg:col-span-2 lg:col-start-6">
                        <h4 className="text-white font-bold text-base mb-6">Menu</h4>
                        <ul className="space-y-3">
                            {[
                                { name: "Beranda", path: "/" },
                                { name: "Cari Event", path: "/#events" },
                                { name: "Jadi Kreator", path: "/become-creator" },
                                { name: "Tentang Kami", path: "/about-us" },
                                { name: "Cek Validasi Tiket", path: "/validasi-tiket" },
                            ].map((link, idx) => (
                                <li key={idx}>
                                    <Link
                                        to={link.path}
                                        className="text-slate-400 hover:text-blue-400 text-sm font-medium transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 3. CONTACT INFO (Col-span-3) */}
                    <div className="lg:col-span-3">
                        <h4 className="text-white font-bold text-base mb-6">Hubungi Kami</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-slate-400 text-sm font-medium">
                                <MapPin size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                <span>
                                    Komplek Bumi Panyileukan jl. Sauyunan 10 Blok F10 5,
                                    Cipadung Kidul, Kota Bandung.
                                </span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                                <Mail size={18} className="text-blue-500 shrink-0" />
                                <a href="mailto:support@heroestix.com" className="hover:text-blue-400 transition-colors">
                                    support@heroestix.com
                                </a>
                            </li>
                            <li className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                                <Phone size={18} className="text-blue-500 shrink-0" />
                                <a href="https://wa.me/6282332901726" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                                    +62 823-3290-1726
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* 4. SOCIALS (Col-span-2) */}
                    <div className="lg:col-span-2">
                        <h4 className="text-white font-bold text-base mb-6">Ikuti Kami</h4>
                        <div className="flex gap-3">
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-red-500 hover:to-purple-500 hover:text-white transition-all duration-300 shadow-sm"
                            >
                                <Instagram size={18} />
                            </a>
                            <a
                                href="https://wa.me/6282332901726"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-[#25D366] hover:text-white transition-all duration-300 shadow-sm"
                            >
                                <MessageCircle size={18} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footnote */}
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-500 font-medium text-center md:text-left">
                        &copy; {currentYear} Heroestix. All rights reserved.
                    </p>

                    <div className="flex gap-6">
                        <Link to="/privacy" className="text-xs text-slate-500 font-medium hover:text-slate-300 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link to="/terms" className="text-xs text-slate-500 font-medium hover:text-slate-300 transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
