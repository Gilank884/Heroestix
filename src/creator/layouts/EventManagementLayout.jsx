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
    QrCode,
    Search,
    Bell,
    User,
    ArrowRight,
    ChevronDown
} from 'lucide-react';
import useAuthStore from '../../auth/useAuthStore';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

const EventManagementLayout = ({ children }) => {
    const { id: eventId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isStaff, setIsStaff] = useState(false);
    const [staffAccess, setStaffAccess] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchEventData = async () => {
            if (eventId) {
                let currentIsStaff = false;
                let currentStaffAccess = [];

                if (user) {
                    // Check if user is staff
                    const { data: staffData } = await supabase
                        .from('event_staffs')
                        .select('id, access_modules')
                        .eq('event_id', eventId)
                        .eq('staff_id', user.id)
                        .single();

                    if (staffData) {
                        currentIsStaff = true;
                        currentStaffAccess = staffData.access_modules || [];
                    }
                } else {
                    // Passwordless check via staff_session
                    const sessionStr = localStorage.getItem('staff_session');
                    if (sessionStr) {
                        try {
                            const session = JSON.parse(sessionStr);
                            if (session && session.eventId === eventId) {
                                const { data: inviteData } = await supabase
                                    .from('event_staff_invitations')
                                    .select('access_modules')
                                    .eq('token', session.token)
                                    .eq('event_id', eventId)
                                    .single();
                                
                                if (inviteData) {
                                    currentIsStaff = true;
                                    currentStaffAccess = inviteData.access_modules || [];
                                }
                            }
                        } catch(e) {}
                    }
                }

                setIsStaff(currentIsStaff);
                setStaffAccess(currentStaffAccess);

                const { data, error } = await supabase
                    .from('events')
                    .select('*, creators(brand_name)')
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
                { name: "Custom Order", path: `/manage/event/${eventId}/custom-order`, icon: ClipboardList },
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

    // Enforce Route Access based on Staff permissions
    useEffect(() => {
        if (!loading && isStaff && eventData) {
            const isCreator = user && user.id === eventData.creator_id;
            
            if (!isCreator && staffAccess.length > 0) {
                const currentPath = location.pathname;
                
                // Collect all allowed paths for this staff
                const visiblePaths = [];
                navSections.forEach(section => {
                    section.items.forEach(item => {
                        if (staffAccess.includes(item.name)) {
                            visiblePaths.push(item.path);
                        }
                    });
                });

                // If current path is exactly event dashboard, we should check if they have "Detail Event" access
                // Since react-router paths might have trailing slashes, ensure exact match or handle it.
                const isCurrentPathAllowed = visiblePaths.some(p => currentPath === p || currentPath === p + '/');

                if (!isCurrentPathAllowed && visiblePaths.length > 0) {
                    console.log("Restricted access. Redirecting to first allowed module:", visiblePaths[0]);
                    navigate(visiblePaths[0], { replace: true });
                }
            }
        }
    }, [location.pathname, isStaff, staffAccess, eventData, loading, navigate]);

    return (
        <div className="flex h-screen bg-white text-slate-800 selection:bg-blue-100 selection:text-blue-700">
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-all duration-500 ease-in-out transform
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:relative lg:translate-x-0 overflow-y-auto no-scrollbar
                `}
            >
                {/* Brand Header */}
                <div className="h-28 flex items-center px-8 border-b border-slate-50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-colors" />
                    <div className="flex items-center gap-5 relative z-10 w-full font-sans">
                        <div className="w-14 h-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-slate-200 group-hover:scale-110 transition-all duration-500 overflow-hidden border border-slate-800">
                             <Layers size={24} className="text-white animate-pulse" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[10px] text-blue-600 font-black uppercase tracking-[0.3em] mb-1.5 opacity-80">Event Manager</span>
                            <h3 className="text-sm font-black text-slate-900 line-clamp-1 leading-tight uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                                HeroesTix
                            </h3>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-50 rounded-xl transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Navigation Links Area */}
                <div className="px-6 py-8 pb-2">
                    <button
                        onClick={() => navigate('/events')}
                        className="group flex items-center gap-4 px-4 py-4 w-full bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-slate-100 hover:border-blue-100 mb-8 active:scale-[0.98]"
                    >
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-slate-200 group-hover:border-blue-200 transition-colors">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        </div>
                        <span className="font-black text-[10px] tracking-[0.2em] uppercase">Back to Hub</span>
                    </button>

                    {/* Event Identity Card - Refined */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900 rounded-[2rem] p-6 relative overflow-hidden group shadow-2xl shadow-slate-200 border border-slate-800"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:bg-blue-500/20 transition-colors duration-700"></div>

                        <div className="relative z-10 flex flex-col gap-5">
                            <div className="flex items-center justify-between">
                                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                                <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Selected Campaign</p>
                                <h2 className="text-white font-black text-lg leading-tight tracking-tight line-clamp-2 uppercase">
                                    {eventData?.title || 'Loading...'}
                                </h2>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Navigation Sections */}
                <nav className="px-4 space-y-8 pb-10 mt-6">
                    {navSections.map((section) => {
                        const isCreator = user && eventData && user.id === eventData.creator_id;
                        let visibleItems = [];
                        if (isCreator) {
                            visibleItems = section.items;
                        } else if (isStaff) {
                            visibleItems = section.items.filter(item => staffAccess.includes(item.name));
                        }

                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={section.title}>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-4">
                                    {section.title}
                                </h3>
                                <div className="space-y-1.5">
                                    {visibleItems.map((item) => {
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
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                {/* Mobile Header */}
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                             <Layers size={20} />
                        </div>
                        <span className="font-black text-xl tracking-tighter text-slate-900 uppercase">Event Manager</span>
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
                                placeholder="Cari fitur manajemen..."
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
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Navigation Finder</p>
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
                        <button className="relative p-3.5 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group/notif">
                            <Bell size={22} className="group-hover/notif:text-blue-600 transition-colors" />
                            <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full shadow-lg shadow-red-200" />
                        </button>

                        <div className="h-10 w-px bg-slate-100" />

                        <div className="flex items-center gap-4 group/profile cursor-pointer">
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-slate-900 leading-none group-hover/profile:text-blue-600 transition-colors uppercase tracking-tight">
                                    {eventData?.creators?.brand_name || 'Creator'}
                                </span>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Authorized Access</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                </div>
                            </div>
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-400 p-[3px] shadow-xl shadow-blue-100 group-hover/profile:scale-105 transition-all duration-500">
                                    <div className="w-full h-full bg-white rounded-[13px] flex items-center justify-center overflow-hidden">
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-blue-600 font-black text-xl">
                                            {(eventData?.creators?.brand_name || 'C').charAt(0)}
                                        </div>
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

export default EventManagementLayout;
