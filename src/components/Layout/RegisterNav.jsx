import { getSubdomainUrl } from "../../lib/navigation";

export default function RegisterNav({ role = "user" }) {
    const isSpecialRole = role === "creator" || role === "developer";
    const mainHomeUrl = getSubdomainUrl("");

    return (
        <nav className="fixed top-0 left-0 w-full h-16 flex items-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/60 z-50">
            <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
                <a
                    href={mainHomeUrl}
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
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                            Heroestix
                        </span>
                        {isSpecialRole && (
                            <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                                {role} Portal
                            </span>
                        )}
                    </div>
                </a>

                <div className="flex items-center">
                    <a
                        href={mainHomeUrl}
                        className="flex items-center gap-2 text-[12px] font-bold text-slate-900 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all group/back"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="group-hover/back:-translate-x-1 transition-transform"
                        >
                            <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
                        </svg>
                        Kembali ke Beranda
                    </a>
                </div>
            </div>
        </nav>
    );
}
