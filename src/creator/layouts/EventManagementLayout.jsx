import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
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
    ArrowLeft,
    ChevronRight,
    ClipboardList,
    UsersRound,
    CalendarCheck,
    Mail,
    Smartphone,
    CreditCard,
    Tag,
    Star,
    Settings,
    Shield,
    BarChart3,
    PieChart,
    QrCode
} from 'lucide-react';
import useAuthStore from '../../auth/useAuthStore';
import { supabase } from '../../lib/supabaseClient';

const EventManagementLayout = ({ children }) => {
    const { id: eventId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEventData = async () => {
            if (eventId) {
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', eventId)
                    .single();

                if (!error && data) {
                    setEventData(data);
                }
                setLoading(false);
            }
        };
        fetchEventData();
    }, [eventId]);

    const navSections = [
        {
            title: "EVENT",
            items: [
                { name: "Detail Event", path: `/manage/event/${eventId}`, icon: Sparkles },
                { name: "Kategori Tiket", path: `/manage/event/${eventId}/ticket-categories`, icon: Ticket },
                { name: "Voucher", path: `/manage/event/${eventId}/vouchers`, icon: Tag },
                { name: "Staff", path: `/manage/event/${eventId}/staff`, icon: Users },
                { name: "Formulir Tambahan", path: `/manage/event/${eventId}/additional-form`, icon: ClipboardList },
                { name: "Laporan Penjualan", path: `/manage/event/${eventId}/sales-report`, icon: BarChart3 },
                { name: "Penarikan Saldo", path: `/manage/event/${eventId}/withdrawals`, icon: Wallet },
            ],
        },
        {
            title: "PENGUNJUNG",
            items: [
                { name: "Daftar Pengunjung", path: `/manage/event/${eventId}/visitors`, icon: Users },
            ],
        },
        {
            title: "VALIDASI",
            items: [
                { name: "Statistik Check-in", path: `/manage/event/${eventId}/check-in-stats`, icon: PieChart },
                { name: "Proses Check-in", path: `/manage/event/${eventId}/check-in`, icon: QrCode },
            ],
        },
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
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Event Manager</span>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Back Link */}
                <div className="px-6 mb-6">
                    <button
                        onClick={() => navigate('/events')}
                        className="w-full flex items-center gap-3 text-slate-400 hover:text-blue-600 transition-all group bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-[11px] tracking-tight uppercase">Dashboard Utama</span>
                    </button>
                </div>

                {/* Event Identity Card */}
                <div className="px-6 mb-8">
                    <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100 shadow-sm group/card transition-all hover:border-blue-100 hover:bg-blue-50/10">
                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/5 group-hover/card:scale-105 transition-transform">
                            <Layers size={20} className="text-blue-600" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Event Identity</p>
                            <h2 className="text-slate-900 font-bold truncate text-[13px] leading-tight tracking-tight">
                                {eventData?.title || 'Loading...'}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Navigation Sections */}
                <nav className="px-5 space-y-8 pb-10">
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
                    <div className="h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EventManagementLayout;
