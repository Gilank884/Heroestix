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
    Settings,
    ArrowRight
} from 'lucide-react';
import useAuthStore from '../../auth/useAuthStore';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="flex h-screen bg-white text-slate-800 selection:bg-blue-100 selection:text-blue-700">
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
                    <div className="h-28 flex items-center px-8 border-b border-slate-50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-colors" />
                        <div className="flex items-center gap-5 relative z-10 w-full font-sans">
                            <div className="w-14 h-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-slate-200 group-hover:scale-110 transition-all duration-500 overflow-hidden border border-slate-800">
                                {stats.image_url ? (
                                    <img src={stats.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Sparkles size={24} className="text-white animate-pulse" />
                                )}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.3em] mb-1.5 opacity-80">Creator Center</span>
                                <h3 className="text-sm font-black text-slate-900 line-clamp-1 leading-tight uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                                    {stats.brand_name || 'Creator'}
                                </h3>
                            </div>
                            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-50 rounded-xl transition-colors">
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
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Sparkles size={20} />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">HeroesTix</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-slate-900 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <Menu size={24} />
                    </button>
                </header>

                {/* Top Header - Desktop Only */}
                <header className="hidden lg:flex items-center justify-between px-10 py-6 bg-white border-b border-slate-50 relative z-20">
                    <div className="flex-1 max-w-2xl relative">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                <Search size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari menu navigasi, event, atau laporan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Escape' && setSearchQuery('')}
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[1.5rem] py-4 pl-16 pr-6 text-sm outline-none text-slate-700 font-bold placeholder:text-slate-300 transition-all shadow-sm group-hover:shadow-md"
                            />

                            {/* Search Results Dropdown */}
                            <AnimatePresence>
                                {searchQuery && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-[2rem] border border-white shadow-2xl overflow-hidden z-50 p-1"
                                    >
                                        <div className="p-4 border-b border-slate-50">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Hasil Navigasi</p>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto no-scrollbar p-1">
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
                                                                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group/item"
                                                            >
                                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all shadow-sm">
                                                                    <Icon size={18} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-black text-slate-900 group-hover/item:text-blue-600 transition-colors uppercase tracking-tight">{item.name}</span>
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.path}</span>
                                                                </div>
                                                                <ArrowRight size={14} className="ml-auto text-slate-200 group-hover/item:text-blue-600 group-hover/item:translate-x-1 transition-all" />
                                                            </Link>
                                                        );
                                                    })
                                            ) : (
                                                <div className="p-10 text-center">
                                                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic animate-pulse">Menu tidak ditemukan</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-10">
                        {/* Live Clock / Meta Status */}
                        <div className="hidden xl:flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 shadow-sm group/time overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 group-hover/time:w-full transition-all duration-700 opacity-5" />
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] tabular-nums relative z-10">
                                {formatDateTime(currentTime)}
                            </span>
                        </div>

                        <div className="h-10 w-px bg-slate-100" />

                        <div className="flex items-center gap-4 group/profile cursor-pointer">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-slate-900 leading-none group-hover/profile:text-blue-600 transition-colors uppercase tracking-tight">
                                    {stats.brand_name || 'Creator'}
                                </span>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Authorized Creator</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                </div>
                            </div>
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-400 p-[3px] shadow-xl shadow-blue-100 group-hover/profile:scale-105 transition-all duration-500">
                                    <div className="w-full h-full bg-white rounded-[13px] flex items-center justify-center overflow-hidden">
                                        {stats.image_url ? (
                                            <img src={stats.image_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-50 flex items-center justify-center text-blue-600 font-black text-xl">
                                                {stats.brand_name?.charAt(0) || 'C'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-lg shadow-lg flex items-center justify-center text-blue-600 border border-slate-100">
                                    <ChevronDown size={14} className="group-hover/profile:rotate-180 transition-transform duration-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-white">
                    <div className="p-6 md:p-12 lg:p-14 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CreatorLayout;
