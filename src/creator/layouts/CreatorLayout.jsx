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
    User
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
                    .select('brand_name')
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
                { name: "Profil Creator", path: "/profile", icon: User },
                { name: "Statistik Event", path: "/events", icon: Sparkles },
                { name: "Laporan Penjualan", path: "/sales-report", icon: BarChart3 },
                { name: "Penarikan Saldo", path: "/withdrawals", icon: Wallet },
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
                {/* Brand Header */}
                <div className="h-24 flex items-center px-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <Layers size={22} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tighter text-slate-900 leading-none uppercase">Backstage</span>
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Creator Portal</span>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation Sections */}
                <nav className="flex-1 px-6 space-y-8 pb-10 mt-4">
                    {navSections.map((section) => (
                        <div key={section.title}>
                            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 ml-4">
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
                                                group flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 relative
                                                ${isActive
                                                    ? 'bg-blue-50 text-blue-600 font-bold'
                                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                                }
                                            `}
                                        >
                                            <Icon size={20} className={`${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`} />
                                            <span className="text-[14px] tracking-tight">{item.name}</span>
                                            {isActive && (
                                                <div className="absolute right-4 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Profile Section */}
                    <div className="pt-6 border-t border-slate-100 mt-10">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-bold shadow-sm">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-black text-slate-900 truncate tracking-tight uppercase">
                                    {stats.brand_name || 'Creator'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{user?.email}</span>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-500 hover:text-red-600 font-bold text-xs uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all"
                        >
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </nav>
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
                    <div className="p-6 md:p-10 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CreatorLayout;
