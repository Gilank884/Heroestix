import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Sparkles,
    Users,
    Ticket,
    Wallet,
    FileSpreadsheet,
    Lock,
    ShieldCheck,
    LogOut,
    Menu,
    X,
    Layers,
    BarChart3,
    User,
    TrendingUp,
    Search,
    Bell,
    ChevronDown,
    Settings
} from 'lucide-react';
import useAuthStore from '../../auth/useAuthStore';
import { supabase } from '../../lib/supabaseClient';

const CreatorLayout = ({ children }) => {
    const { user, logout } = useAuthStore();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [stats, setStats] = useState({ brand_name: 'PT. Peristiwa Kreatif...' });

    // Fetch Creator Data
    useEffect(() => {
        const fetchCreatorData = async () => {
            if (user?.id) {
                const { data, error } = await supabase
                    .from('creators')
                    .select('brand_name, image_url')
                    .eq('id', user.id)
                    .single();

                if (!error && data) {
                    setStats(data);
                }
            }
        };
        fetchCreatorData();
    }, [user]);

    const navSections = [
        {
            title: "MAIN MENU",
            items: [
                {
                    name: "Dashboard",
                    path: "/",
                    icon: LayoutDashboard,
                    color: "blue"
                },
                {
                    name: "Profil Creator",
                    path: "/profile",
                    icon: User,
                    color: "orange"
                },
                {
                    name: "Statistik Event",
                    path: "/events",
                    icon: Sparkles,
                    color: "purple"
                },
                {
                    name: "Overview",
                    path: "/sales-report",
                    icon: TrendingUp,
                    color: "emerald"
                },
            ],
        }
    ];

    const getColorClasses = (color, isActive) => {
        const schemes = {
            blue: {
                activeBg: "from-blue-500/10 to-transparent",
                activeText: "text-blue-400",
                iconBg: "bg-gradient-to-br from-blue-600 to-blue-400",
                iconText: "text-white",
                shadow: "shadow-blue-500/20",
                indicator: "bg-blue-500",
                hoverText: "group-hover:text-blue-400",
                iconIdleBg: "bg-slate-800/50",
                iconIdleText: "text-slate-400"
            },
            orange: {
                activeBg: "from-orange-500/10 to-transparent",
                activeText: "text-orange-400",
                iconBg: "bg-gradient-to-br from-orange-600 to-orange-400",
                iconText: "text-white",
                shadow: "shadow-orange-500/20",
                indicator: "bg-orange-500",
                hoverText: "group-hover:text-orange-400",
                iconIdleBg: "bg-slate-800/50",
                iconIdleText: "text-slate-400"
            },
            purple: {
                activeBg: "from-purple-500/10 to-transparent",
                activeText: "text-purple-400",
                iconBg: "bg-gradient-to-br from-purple-600 to-purple-400",
                iconText: "text-white",
                shadow: "shadow-purple-500/20",
                indicator: "bg-purple-500",
                hoverText: "group-hover:text-purple-400",
                iconIdleBg: "bg-slate-800/50",
                iconIdleText: "text-slate-400"
            },
            emerald: {
                activeBg: "from-emerald-500/10 to-transparent",
                activeText: "text-emerald-400",
                iconBg: "bg-gradient-to-br from-emerald-600 to-emerald-400",
                iconText: "text-white",
                shadow: "shadow-emerald-500/20",
                indicator: "bg-emerald-500",
                hoverText: "group-hover:text-emerald-400",
                iconIdleBg: "bg-slate-800/50",
                iconIdleText: "text-slate-400"
            }
        };
        return schemes[color] || schemes.blue;
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] text-slate-800 selection:bg-blue-100 selection:text-blue-700">
            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-72 bg-[#0F172A] border-r border-slate-800 transition-all duration-500 ease-in-out transform
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:relative lg:translate-x-0 overflow-y-auto no-scrollbar
                `}
            >
                {/* Decorative Blur Blobs for "Colorful" feel */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />
                    <div className="absolute top-1/2 -right-24 w-48 h-48 bg-purple-600/10 rounded-full blur-[60px]" />
                </div>
                {/* Content Container */}
                <div className="flex flex-col h-full relative z-10">
                    {/* User Identity Header - High End Design */}
                    <div className="p-8 pb-6 border-b border-slate-800/50 bg-gradient-to-b from-blue-900/10 to-transparent">
                        <div className="flex items-center gap-4 group">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-400 p-[2px] shadow-lg shadow-blue-900/40 group-hover:rotate-3 transition-transform duration-500 overflow-hidden">
                                    <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white text-xl overflow-hidden">
                                        {stats.image_url ? (
                                            <img
                                                src={stats.image_url}
                                                alt={stats.brand_name}
                                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                            />
                                        ) : (
                                            user?.email?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-[#0F172A] rounded-full shadow-sm" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] text-blue-400 uppercase tracking-[0.2em] mb-1">Creator Panel</span>
                                <h3 className="text-lg text-white truncate leading-tight tracking-tight uppercase group-hover:text-blue-400 transition-colors">
                                    {stats.brand_name || 'Creator'}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{user?.email}</span>
                                </div>
                            </div>
                            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto p-2 hover:bg-slate-800 rounded-xl transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Section */}
                    <nav className="flex-1 px-4 py-8 space-y-8 overflow-y-auto no-scrollbar">
                        {navSections.map((section) => (
                            <div key={section.title} className="space-y-4">
                                <h3 className="text-[10px] text-slate-500 uppercase tracking-[0.2em] px-4">
                                    {section.title}
                                </h3>
                                <div className="space-y-1">
                                    {section.items.map((item) => {
                                        const isActive = location.pathname === item.path;
                                        const Icon = item.icon;
                                        const colors = getColorClasses(item.color, isActive);

                                        return (
                                            <Link
                                                key={item.name}
                                                to={item.path}
                                                className={`
                                                group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 relative
                                                ${isActive
                                                        ? `bg-gradient-to-r ${colors.activeBg} ${colors.activeText}`
                                                        : `text-slate-400 hover:bg-slate-800/60 ${colors.hoverText} hover:translate-x-1`
                                                    }
                                            `}
                                            >
                                                <div className={`
                                                w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                                                ${isActive
                                                        ? `${colors.iconBg} ${colors.iconText} shadow-lg ${colors.shadow}`
                                                        : `${colors.iconIdleBg} ${colors.iconIdleText} group-hover:bg-slate-700/50 group-hover:shadow-md transition-all`
                                                    }
                                            `}>
                                                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                                </div>
                                                <span className={`text-[14px] tracking-tight ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'}`}>
                                                    {item.name}
                                                </span>
                                                {isActive && (
                                                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 ${colors.indicator} rounded-l-full shadow-[0_0_12px_rgba(37,99,235,0.4)]`} />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Footer / Sign Out Section */}
                    <div className="p-6 border-t border-slate-800/50">
                        <button
                            onClick={logout}
                            className="group w-full flex items-center justify-between gap-2 px-6 py-4 bg-slate-800/30 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-2xl transition-all duration-300 border border-transparent hover:border-red-500/20"
                        >
                            <div className="flex items-center gap-3">
                                <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
                                <span className="text-xs uppercase tracking-widest">Sign Out</span>
                            </div>
                            <div className="w-1.5 h-1.5 bg-slate-700 rounded-full group-hover:bg-red-400 transition-colors" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <Layers size={24} className="text-blue-600" />
                        <span className="text-xl tracking-tighter text-slate-900 uppercase">HeroesTix</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-slate-900">
                        <Menu size={24} />
                    </button>
                </header>

                {/* Top Header - Desktop Only (Hidden on mobile as it has its own) */}
                <header className="hidden lg:flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200">
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari event, transaksi, atau bantuan..."
                                className="w-full bg-slate-100/50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none text-slate-600 font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
                        </button>

                        <div className="h-8 w-px bg-slate-200" />

                        <div className="flex items-center gap-3 pl-2">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-semibold text-slate-900 leading-none">
                                    {stats.brand_name || 'Creator'}
                                </span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">
                                    {user?.email}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-400 p-[2px] shadow-sm">
                                <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center overflow-hidden">
                                    {stats.image_url ? (
                                        <img src={stats.image_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={18} className="text-blue-600" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
                    <div className="p-8 md:p-12 lg:p-14 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CreatorLayout;
