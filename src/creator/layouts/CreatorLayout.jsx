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
    Layers
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
            title: "JELAJAHI",
            items: [
                { name: "Statistik", path: "/", icon: LayoutDashboard },
                { name: "Daftar Event", path: "/events", icon: Sparkles },
            ],
        },
        {
            title: "Admin",
            items: [
                { name: "Staff", path: "/staff", icon: Users },
            ],
        },
        {
            title: "KEUANGAN",
            items: [
                { name: "Voucher", path: "/vouchers", icon: Ticket },
                { name: "Cash", path: "/cash", icon: Wallet },
            ],
        },
        {
            title: "LAPORAN",
            items: [
                { name: "Rekap Data", path: "/reports", icon: FileSpreadsheet },
            ],
        },
        {
            title: "KEAMANAN",
            items: [
                { name: "Ubah Password", path: "/security/password", icon: Lock },
                { name: "Token Generator", path: "/security/tokens", icon: ShieldCheck },
            ],
        },
        {
            title: "LAINNYA",
            items: [
                { name: "Cetak Tiket Gelang", path: "/tools/bracelet-printing", icon: Ticket },
            ],
        },
    ];

    return (
        <div className="flex h-screen bg-[#f3f4f6]">
            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-72 bg-[#1a36c7] text-white transition-all duration-300 transform
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:relative lg:translate-x-0 overflow-y-auto
                `}
            >
                {/* Brand Header */}
                <div className="p-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Layers size={24} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Backstage</h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/70 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Creator Profile Card */}
                <div className="px-6 mb-8 pt-4">
                    <div className="bg-white rounded-[1.2rem] p-4 flex items-center gap-4 shadow-lg">
                        <div className="w-12 h-12 bg-[#4a6cf7] rounded-xl flex items-center justify-center flex-shrink-0">
                            <Layers size={24} className="text-white" />
                        </div>
                        <div className="overflow-hidden">
                            <h2 className="text-[#1a202c] font-bold truncate text-[15px]">
                                {stats.brand_name}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Navigation Sections */}
                <nav className="px-5 space-y-8 pb-10">
                    {navSections.map((section) => (
                        <div key={section.title}>
                            <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 ml-4">
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
                                                flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group
                                                ${isActive
                                                    ? 'bg-[#4a6cf7] text-white shadow-lg shadow-[#1a36c7]/50'
                                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                                                }
                                            `}
                                        >
                                            <Icon size={20} className={`${isActive ? 'text-white' : 'text-white/50 group-hover:text-white'} transition-colors`} />
                                            <span className="font-bold text-[14px]">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Logout Button */}
                    <div className="pt-4 border-t border-white/10 mt-10">
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-300 hover:bg-red-500/10 transition-all font-bold text-[14px]"
                        >
                            <LogOut size={20} />
                            <span>Logout System</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Layers size={24} className="text-[#1a36c7]" />
                        <span className="font-bold text-xl">Backstage</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-[#1a36c7]">
                        <Menu size={24} />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto bg-gray-50 relative">
                    <div className="p-6 md:p-10 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CreatorLayout;
