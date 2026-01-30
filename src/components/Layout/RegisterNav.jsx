import { Link } from "react-router-dom";

export default function RegisterNav({ role = "user" }) {
    const isSpecialRole = role === "creator" || role === "developer";

    return (
        <nav className="fixed top-0 left-0 w-full h-16 flex items-center bg-white/50 backdrop-blur-md border-b border-slate-100 z-50">
            <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
                <Link
                    to="/"
                    className="flex items-center gap-2 group"
                >
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <img
                            src="/Logo/Logo.png"
                            alt="Logo"
                            className="h-5 w-auto brightness-0 invert"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 tracking-tight leading-none">
                            Heroestix
                        </span>
                        {isSpecialRole && (
                            <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wider">
                                {role} Portal
                            </span>
                        )}
                    </div>
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    <Link to="/about-us" className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors">Bantuan</Link>
                    <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors">Beranda</Link>
                </div>
            </div>
        </nav>
    );
}


