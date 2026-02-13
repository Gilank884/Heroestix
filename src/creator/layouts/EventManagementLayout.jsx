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
    const [isStaff, setIsStaff] = useState(false);
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchEventData = async () => {
            if (eventId && user) {
                // Check if user is staff
                const { data: staffData } = await supabase
                    .from('event_staffs')
                    .select('id')
                    .eq('event_id', eventId)
                    .eq('staff_id', user.id)
                    .single();

                setIsStaff(!!staffData);

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
    }, [eventId, user]);

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
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-all duration-500 ease-in-out transform
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:relative lg:translate-x-0 overflow-y-auto no-scrollbar
                `}
            >
                {/* Brand Header */}
                <div className="h-24 flex items-center px-8 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1a36c7] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                            <Layers size={20} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tighter text-slate-900 leading-none uppercase">HeroesTix</span>
                            <span className="text-[10px] font-bold text-[#1a36c7] uppercase tracking-widest mt-1">Event Manager</span>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Back Link */}
                <div className="px-6 py-6 pb-2">
                    <button
                        onClick={() => navigate('/events')}
                        className="w-full flex items-center gap-3 text-slate-400 hover:text-[#1a36c7] transition-all group px-2 py-2 mb-4"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-[11px] tracking-tight uppercase">Dashboard Utama</span>
                    </button>

                    {/* Event Identity Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 relative overflow-hidden group shadow-xl shadow-slate-200">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>

                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                                    <Layers size={18} className="text-white" />
                                </div>
                                <span className="bg-white/10 text-white text-[9px] font-bold px-2 py-1 rounded-lg backdrop-blur-md border border-white/5 uppercase tracking-wider">
                                    Active
                                </span>
                            </div>

                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Event Identity</p>
                            <h2 className="text-white font-bold text-[14px] leading-snug tracking-tight line-clamp-2">
                                {eventData?.title || 'Loading Event...'}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Navigation Sections */}
                <nav className="px-4 space-y-8 pb-10 mt-6">
                    {navSections.map((section) => (
                        <div key={section.title}>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-4">
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
                                                group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden
                                                ${isActive
                                                    ? 'bg-[#1a36c7] text-white shadow-lg shadow-blue-900/20'
                                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                                }
                                            `}
                                        >
                                            <Icon
                                                size={18}
                                                className={`
                                                    ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} 
                                                    transition-colors duration-300
                                                `}
                                            />
                                            <span className={`text-[13px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                                                {item.name}
                                            </span>

                                            {/* Active Indicator Interaction */}
                                            {isActive && (
                                                <div className="absolute right-4 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse" />
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
