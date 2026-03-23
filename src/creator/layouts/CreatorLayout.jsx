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
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({ brand_name: 'Data Sedang Dimuat' });
    const [currentTime, setCurrentTime] = useState(new Date());

    // Live Clock Update
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDateTime = (date) => {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        const dateStr = date.toLocaleDateString('id-ID', options);
        const timeStr = date.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });
        return `${dateStr} • ${timeStr}`;
    };

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



    return (
        <div className="flex h-screen bg-[#F8FAFC] text-slate-800 selection:bg-blue-100 selection:text-blue-700">
            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-all duration-500 ease-in-out transform
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:relative lg:translate-x-0 overflow-y-auto no-scrollbar shadow-sm
                `}
            >

                <div className="flex flex-col h-full relative z-10 bg-white">
                    {/* User Identity Header - High End Design */}
                    <div className="h-20 flex items-center px-6 border-b border-slate-100">
                        <div className="flex items-center gap-4 group">
                            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-3 transition-transform duration-500">
                                <Sparkles className="text-white" size={20} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em] mb-1">Creator Panel</span>
                                <h3 className="text-sm font-black text-slate-900 line-clamp-2 leading-tight uppercase group-hover:text-blue-600 transition-colors">
                                    {stats.brand_name || 'Creator'}
                                </h3>
                            </div>
                            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                <X size={20} className="text-slate-400" />
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
                                <div className="space-y-1.5">
                                    {section.items.map((item) => {
                                        const isActive = location.pathname === item.path;
                                        const Icon = item.icon;

                                        return (
                                            <Link
                                                key={item.name}
                                                to={item.path}
                                                className={`
                                                group flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 relative
                                                ${isActive
                                                        ? `bg-blue-50 text-blue-600 font-bold`
                                                        : `text-slate-500 hover:bg-slate-50 hover:text-slate-900`
                                                    }
                                            `}
                                            >
                                                <div className={`
                                                w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                                                ${isActive
                                                        ? `bg-white text-blue-600 shadow-sm border border-blue-100`
                                                        : `bg-slate-50 text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all`
                                                    }
                                            `}>
                                                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                                </div>
                                                <span className="text-sm tracking-tight transition-colors">
                                                    {item.name}
                                                </span>
                                                {isActive && (
                                                    <div className="absolute right-3 w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.3)]" />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Footer / Sign Out Section */}
                    <div className="p-4 border-t border-slate-100 bg-white">
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                logout();
                            }}
                            className="group w-full flex items-center justify-between gap-2 px-6 py-4 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all duration-300 border border-slate-100 hover:border-red-100"
                        >
                            <div className="flex items-center gap-3">
                                <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
                                <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
                            </div>
                            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full group-hover:bg-red-400 transition-colors" />
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
                                placeholder="Cari menu navigasi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Escape' && setSearchQuery('')}
                                className="w-full bg-slate-100/50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none text-slate-600 font-medium"
                            />

                            {/* Search Results Dropdown */}
                            {searchQuery && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Hasil Navigasi</p>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto p-1">
                                        {navSections.flatMap(s => s.items)
                                            .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                            .length > 0 ? (
                                            navSections.flatMap(s => s.items)
                                                .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                                .map((item) => {
                                                    const Icon = item.icon;
                                                    return (
                                                        <Link
                                                            key={item.path}
                                                            to={item.path}
                                                            onClick={() => setSearchQuery('')}
                                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                                <Icon size={16} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{item.name}</span>
                                                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">{item.path}</span>
                                                            </div>
                                                        </Link>
                                                    );
                                                })
                                        ) : (
                                            <div className="p-8 text-center">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic opacity-60">Menu tidak ditemukan</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm">
                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest tabular-nums">
                                {formatDateTime(currentTime)}
                            </span>
                        </div>

                        <div className="h-8 w-px bg-slate-200" />

                        <div className="flex items-center gap-3 pl-2">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-semibold text-slate-900 leading-none">
                                    {stats.brand_name || 'Creator'}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-1">
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
                    <div className="p-6 md:p-12 lg:p-14 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CreatorLayout;
