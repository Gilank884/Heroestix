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
    TrendingUp
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
                { name: "Dashboard", path: "/", icon: LayoutDashboard },
                { name: "Profil Creator", path: "/profile", icon: User },
                { name: "Statistik Event", path: "/events", icon: Sparkles },
                { name: "Overview", path: "/sales-report", icon: TrendingUp },
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
                    lg:relative lg:translate-x-0 overflow-y-auto no-scrollbar
                `}
            >
                {/* Content Container */}
                <div className="flex flex-col h-full">
                    {/* User Identity Header - High End Design */}
                    <div className="p-8 pb-6 border-b border-slate-100 bg-gradient-to-b from-blue-50/50 to-transparent">
                        <div className="flex items-center gap-4 group">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 p-[2px] shadow-lg shadow-blue-200 group-hover:rotate-3 transition-transform duration-500 overflow-hidden">
                                    <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-black text-blue-600 text-xl overflow-hidden">
                                        {stats.image_url ? (
                                            <img
                                                src={stats.image_url}
                                                alt={stats.brand_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            user?.email?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Authenticated</span>
                                <h3 className="text-lg font-black text-slate-900 truncate leading-tight tracking-tight uppercase group-hover:text-blue-600 transition-colors">
                                    {stats.brand_name || 'Creator'}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">{user?.email}</span>
                                </div>
                            </div>
                            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Section */}
                    <nav className="flex-1 px-4 py-8 space-y-8 overflow-y-auto no-scrollbar">
                        {navSections.map((section) => (
                            <div key={section.title} className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-4">
                                    {section.title}
                                </h3>
                                <div className="space-y-1">
                                    {section.items.map((item) => {
                                        const isActive = location.pathname === item.path;
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.name}
                                                to={item.path}
                                                className={`
                                                group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 relative
                                                ${isActive
                                                        ? 'bg-gradient-to-r from-blue-600/5 to-transparent text-blue-600 font-bold'
                                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
                                                    }
                                            `}
                                            >
                                                <div className={`
                                                w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                                                ${isActive
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                                        : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
                                                    }
                                            `}>
                                                    <Icon size={18} />
                                                </div>
                                                <span className="text-[14px] tracking-tight">{item.name}</span>
                                                {isActive && (
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-l-full shadow-[0_0_12px_rgba(37,99,235,0.4)]" />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Footer / Sign Out Section */}
                    <div className="p-6 border-t border-slate-100">
                        <button
                            onClick={logout}
                            className="group w-full flex items-center justify-between gap-2 px-6 py-4 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-2xl transition-all duration-300 border border-transparent hover:border-red-100"
                        >
                            <div className="flex items-center gap-3">
                                <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
                                <span className="font-bold text-xs uppercase tracking-widest">Sign Out</span>
                            </div>
                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full group-hover:bg-red-400 transition-colors" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <Layers size={24} className="text-blue-600" />
                        <span className="font-black text-xl tracking-tighter text-slate-900 uppercase">Backstage</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-slate-900">
                        <Menu size={24} />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
                    <div className="p-6 md:p-8 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CreatorLayout;
