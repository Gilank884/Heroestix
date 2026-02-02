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
        <footer className="bg-white pt-24 pb-12 border-t border-slate-100">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
                    {/* 1. BRAND & DESCRIPTION (Col-span-4) */}
                    <div className="md:col-span-4 space-y-6">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:rotate-[10deg] shadow-lg shadow-blue-600/10">
                                <img
                                    src="/Logo/Logo.png"
                                    alt="Heroestix"
                                    className="h-6 w-auto brightness-0 invert"
                                />
                            </div>
                            <span className="text-2xl font-black tracking-tight text-slate-900">
                                Heroestix
                            </span>
                        </Link>
                        <p className="text-slate-500 leading-relaxed font-medium">
                            Platform tiket event terpercaya untuk komunitas. Temukan, buat, dan rayakan momen terbaikmu bersama kami.
                        </p>

                    </div>

                    {/* 2. NAVIGATION (Col-span-2) */}
                    <div className="md:col-span-2 md:col-start-6">
                        <h4 className="text-slate-900 font-bold mb-6">Menu</h4>
                        <ul className="space-y-4">
                            {[
                                { name: "Beranda", path: "/" },
                                { name: "Cari Event", path: "/#events" },
                                { name: "Jadi Kreator", path: "/become-creator" },
                                { name: "Tentang Kami", path: "/about-us" },
                            ].map((link, idx) => (
                                <li key={idx}>
                                    <Link
                                        to={link.path}
                                        className="text-slate-500 hover:text-blue-600 font-medium transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 3. CONTACT INFO (Col-span-3) */}
                    <div className="md:col-span-3">
                        <h4 className="text-slate-900 font-bold mb-6">Hubungi Kami</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-slate-500 font-medium">
                                <MapPin size={20} className="text-blue-600 shrink-0 mt-0.5" />
                                <span>
                                    Komplek Bumi Panyileukan jl. Sauyunan 10 Blok F10 5,<br />
                                    Cipadung Kidul, Kec. Panyileukan, Kota Bandung, Jawa Barat 40626
                                </span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-500 font-medium">
                                <Mail size={20} className="text-blue-600 shrink-0" />
                                <a href="mailto:support@heroestix.com" className="hover:text-blue-600 transition-colors">
                                    support@heroestix.com
                                </a>
                            </li>
                            <li className="flex items-center gap-3 text-slate-500 font-medium">
                                <Phone size={20} className="text-blue-600 shrink-0" />
                                <a href="https://wa.me/6282332901726" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                                    +62 823-3290-1726
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* 4. SOCIALS (Col-span-2) */}
                    <div className="md:col-span-2">
                        <h4 className="text-slate-900 font-bold mb-6">Ikuti Kami</h4>
                        <div className="flex gap-4">
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#E4405F] hover:text-white transition-all duration-300 shadow-sm"
                            >
                                <Instagram size={20} />
                            </a>
                            <a
                                href="https://wa.me/6282332901726"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#25D366] hover:text-white transition-all duration-300 shadow-sm"
                            >
                                <MessageCircle size={20} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footnote */}
                <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[13px] text-slate-400 font-medium text-center md:text-left">
                        &copy; {currentYear} Heroestix. All rights reserved.
                    </p>

                    <div className="flex gap-8">
                        <Link to="/privacy" className="text-[13px] text-slate-400 font-medium hover:text-slate-900 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link to="/terms" className="text-[13px] text-slate-400 font-medium hover:text-slate-900 transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
