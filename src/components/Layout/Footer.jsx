import React from "react";
import { Link } from "react-router-dom";
import {
    Instagram,
    MessageCircle, // For WhatsApp
    MapPin,
    Mail,
    Phone,
    ArrowRight,
    Globe
} from "lucide-react";

export default function BottomBar() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full pt-16 pb-12 px-4 md:px-6 lg:px-12 bg-white relative overflow-hidden font-['Outfit'] mt-10">
            {/* Main Footer Card */}
            <div className="max-w-7xl mx-auto relative group">
                <div className="relative z-10 bg-[#0a192f] rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-16 overflow-hidden shadow-[0_40px_100px_-20px_rgba(10,25,47,0.3)]">
                    {/* Decorative Elements for Dark Blue Theme */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full -ml-40 -mb-40 pointer-events-none"></div>

                    {/* Subtle Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 relative">
                        {/* 1. BRAND & DESCRIPTION */}
                        <div className="lg:col-span-4 space-y-8">
                            <Link to="/" className="flex items-center gap-4 group/logo w-fit">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/30 group-hover/logo:scale-110 transition-all duration-500">
                                    <img
                                        src="/Logo/Logo.png"
                                        alt="Heroestix"
                                        className="h-7 w-auto brightness-0 invert"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black tracking-tight text-white leading-none">
                                        Heroestix
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">
                                        Moments Portal
                                    </span>
                                </div>
                            </Link>
                            <p className="text-blue-100/70 leading-relaxed font-medium text-sm max-w-sm">
                                Platform tiket event terpercaya untuk komunitas. Temukan, buat, dan rayakan momen terbaikmu bersama kami melalui ekosistem digital yang seamless.
                            </p>

                            <div className="pt-4">
                                <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                    Ikuti Kami
                                </h4>
                                <div className="flex gap-4">
                                    <a
                                        href="https://instagram.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-200 hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-red-500 hover:to-purple-500 hover:text-white transition-all duration-500 shadow-xl"
                                    >
                                        <Instagram size={20} />
                                    </a>
                                    <a
                                        href="https://wa.me/6282332901726"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-200 hover:bg-[#25D366] hover:text-white transition-all duration-500 shadow-xl"
                                    >
                                        <MessageCircle size={20} />
                                    </a>
                                </div>
                            </div>


                        </div>

                        {/* 2. MENU */}
                        <div className="lg:col-span-3">
                            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                Menu
                            </h4>
                            <ul className="space-y-4">
                                {[
                                    { name: "Beranda", path: "/" },
                                    { name: "Cari Event", path: "/#events" },
                                    { name: "Jadi Kreator", path: "/become-creator" },
                                    { name: "Tentang Kami", path: "/about-us" },
                                    { name: "Validasi Tiket", path: "/validasi-tiket" },
                                ].map((link, idx) => (
                                    <li key={idx}>
                                        <Link
                                            to={link.path}
                                            className="text-blue-100/60 hover:text-white text-sm font-semibold transition-all hover:translate-x-1 inline-block"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 3. CONTACT INFO */}
                        <div className="lg:col-span-5">
                            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                Hubungi Kami
                            </h4>
                            <ul className="space-y-6">
                                <li className="flex items-start gap-4 group/contact">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 group-hover/contact:bg-blue-600 group-hover/contact:text-white transition-all duration-300">
                                        <MapPin size={18} />
                                    </div>
                                    <span className="text-blue-100/60 text-sm font-medium leading-relaxed group-hover/contact:text-white transition-colors">
                                        Komplek Bumi Panyileukan jl. Sauyunan 10 Blok F10 5, Bandung.
                                    </span>
                                </li>
                                <li className="flex items-center gap-4 group/contact">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 group-hover/contact:bg-blue-600 group-hover/contact:text-white transition-all duration-300">
                                        <Mail size={18} />
                                    </div>
                                    <a href="mailto:support@heroestix.com" className="text-blue-100/60 text-sm font-medium hover:text-white transition-colors">
                                        support@heroestix.com
                                    </a>
                                </li>
                                <li className="flex items-center gap-4 group/contact">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400 group-hover/contact:bg-emerald-500 group-hover/contact:text-white transition-all duration-300">
                                        <Phone size={18} />
                                    </div>
                                    <a href="https://wa.me/6282332901726" target="_blank" rel="noopener noreferrer" className="text-blue-100/60 text-sm font-medium hover:text-white transition-colors">
                                        +62 823-3290-1726
                                    </a>
                                </li>
                            </ul>
                        </div>


                    </div>

                    {/* Bottom Footnote */}
                    <div className="mt-16 pt-10 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <Globe size={14} className="text-blue-300/40" />
                            <p className="text-[10px] text-blue-300/40 font-bold uppercase tracking-widest">
                                &copy; {currentYear} Heroestix. Engineered with precision.
                            </p>
                        </div>

                        <div className="flex gap-8">
                            <Link to="/privacy" className="text-[10px] text-blue-300/40 font-black uppercase tracking-widest hover:text-blue-400 transition-colors">
                                Privacy
                            </Link>
                            <Link to="/terms" className="text-[10px] text-blue-300/40 font-black uppercase tracking-widest hover:text-blue-400 transition-colors">
                                Terms
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
