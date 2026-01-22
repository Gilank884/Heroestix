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
    ChevronDown,
    Home,
    Settings,
    Shield
} from 'lucide-react';
import useAuthStore from '../../auth/useAuthStore';
import { supabase } from '../../lib/supabaseClient';

const EventManagementLayout = ({ children }) => {
    const { id: eventId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

    const globalNav = [
        { name: "Home", path: "/", icon: Home },
        { name: "Events", path: "/events", icon: Sparkles },
        { name: "Staff", path: "/staff", icon: UsersRound },
        { name: "Vouchers", path: "/vouchers", icon: Ticket },
        { name: "Finance", path: "/cash", icon: Wallet },
        { name: "Recap", path: "/reports", icon: FileSpreadsheet },
        { name: "Security", path: "/security/password", icon: Shield },
    ];

    const navSections = [
        {
            title: "EVENT",
            items: [
                { name: "Statistik", path: `/manage/event/${eventId}/stats`, icon: LayoutDashboard },
                { name: "Detail Event", path: `/manage/event/${eventId}`, icon: Sparkles },
                { name: "Formulir Tambahan", path: `/manage/event/${eventId}/additional-form`, icon: ClipboardList },
                { name: "Kategori Tiket", path: `/manage/event/${eventId}/ticket-categories`, icon: Ticket },
                { name: "Fasilitas Event", path: `/manage/event/${eventId}/facilities`, icon: Star },
                { name: "Staff", path: `/manage/event/${eventId}/staff`, icon: Users },
                { name: "Line Up", path: `/manage/event/${eventId}/lineup`, icon: UsersRound },
                { name: "Voucher", path: `/manage/event/${eventId}/vouchers`, icon: Tag },
                { name: "Cash", path: `/manage/event/${eventId}/cash`, icon: Wallet },
            ],
        },
        {
            title: "PENGUNJUNG",
            items: [
                { name: "Statistik Pengunjung", path: `/manage/event/${eventId}/visitor-stats`, icon: LayoutDashboard },
                { name: "Pengunjung", path: `/manage/event/${eventId}/visitors`, icon: Users },
                { name: "Pengunjung Nonaktif", path: `/manage/event/${eventId}/inactive-visitors`, icon: Users },
                { name: "Point Of Sales", path: `/manage/event/${eventId}/pos`, icon: CreditCard },
            ],
        },
        {
            title: "VALIDASI TIKET",
            items: [
                { name: "Statistik Checkin", path: `/manage/event/${eventId}/checkin-stats`, icon: Smartphone },
                { name: "Check-In", path: `/manage/event/${eventId}/check-in`, icon: CalendarCheck },
            ],
        },
        {
            title: "MARKETING",
            items: [
                { name: "Broadcast Email", path: `/manage/event/${eventId}/broadcast`, icon: Mail },
            ],
        },
    ];

    return (
        <div className="flex h-screen bg-white">
            {/* Column 1: Skinny Global Sidebar */}
            <aside className="w-[80px] bg-[#1a2b8b] flex flex-col items-center py-6 border-r border-white/5 z-50">
                <div className="mb-10">
                    <div className="bg-white/20 p-2.5 rounded-xl">
                        <Layers size={24} className="text-white" />
                    </div>
                </div>

                <nav className="flex-1 space-y-4">
                    {globalNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                title={item.name}
                                className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center transition-all group relative
                                    ${isActive ? 'bg-white/20 text-white shadow-inner' : 'text-white/40 hover:bg-white/5 hover:text-white'}
                                `}
                            >
                                <Icon size={20} />
                                <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                                    {item.name}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto">
                    <button className="w-12 h-12 rounded-xl flex items-center justify-center text-white/40 hover:bg-white/5 hover:text-white transition-all">
                        <Settings size={20} />
                    </button>
                </div>
            </aside>

            {/* Column 2: Event Specific Sidebar */}
            <aside
                className={`
                    w-[260px] bg-[#1a2b8b] text-white transition-all duration-300 transform
                    overflow-y-auto border-l border-white/5
                `}
            >
                {/* Back Link */}
                <div className="p-6 pb-2">
                    <button
                        onClick={() => navigate('/events')}
                        className="flex items-center gap-3 text-white/50 hover:text-white transition-all group mb-8 bg-white/5 px-4 py-2 rounded-lg border border-white/5"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-[9px] tracking-[0.1em] uppercase">Kembali</span>
                    </button>

                    {/* Event Identity Card */}
                    <div className="bg-white rounded-[1.2rem] p-4 flex items-center gap-4 shadow-2xl mb-10 border border-white/10 relative overflow-hidden group/card shadow-blue-900/40">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full -mr-8 -mt-8 group-hover/card:scale-150 transition-transform duration-700"></div>
                        <div className="w-10 h-10 bg-[#4a6cf7] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                            <Layers size={20} className="text-white" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[9px] font-black text-[#4a6cf7] uppercase tracking-[0.1em] mb-0.5">Event Identity</p>
                            <h2 className="text-[#1a202c] font-bold truncate text-[12px] leading-tight">
                                {eventData?.title || 'Loading...'}
                            </h2>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${eventData?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {eventData?.status || 'Active'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Sections */}
                <nav className="px-4 space-y-9 pb-10">
                    {navSections.map((section) => (
                        <div key={section.title}>
                            <div className="flex items-center gap-3 mb-4 px-2">
                                <div className="h-[1px] flex-1 bg-white/10"></div>
                                <h3 className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] whitespace-nowrap">
                                    {section.title}
                                </h3>
                                <div className="h-[1px] w-4 bg-white/10"></div>
                            </div>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            className={`
                                                flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-200 group
                                                ${isActive
                                                    ? 'bg-[#4a6cf7] text-white shadow-lg shadow-blue-600/20 translate-x-1'
                                                    : 'text-white/40 hover:bg-white/5 hover:text-white'
                                                }
                                            `}
                                        >
                                            <Icon size={18} className={`${isActive ? 'text-white' : 'text-white/20 group-hover:text-white'} transition-colors`} />
                                            <span className="font-bold text-[13px] tracking-tight">{item.name}</span>
                                            {isActive && (
                                                <ChevronRight size={14} className="ml-auto text-white/50" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Column 3: Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Subtle depth shadow between sidebar and content */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/[0.02] to-transparent pointer-events-none z-10"></div>

                <main className="flex-1 overflow-y-auto bg-[#f8f9fc]">
                    <div className="h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EventManagementLayout;
