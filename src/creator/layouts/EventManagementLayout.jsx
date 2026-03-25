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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isStaff, setIsStaff] = useState(false);
    const [staffAccess, setStaffAccess] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        logout();
    };

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
                        } catch (e) { }
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
                { name: "Event Detail", path: `/manage/event/${eventId}`, icon: Sparkles },
                { name: "Ticket Categories", path: `/manage/event/${eventId}/ticket-categories`, icon: Ticket },
                { name: "Vouchers", path: `/manage/event/${eventId}/vouchers`, icon: Tag },
                { name: "Staff", path: `/manage/event/${eventId}/staff`, icon: Users },
                { name: "Additional Forms", path: `/manage/event/${eventId}/additional-form`, icon: ClipboardList },
                { name: "Sales Report", path: `/manage/event/${eventId}/sales-report`, icon: BarChart3 },
                { name: "Withdrawals", path: `/manage/event/${eventId}/withdrawals`, icon: Wallet },
            ],
        },
        {
            title: "VISITORS",
            items: [
                { name: "Visitor List", path: `/manage/event/${eventId}/visitors`, icon: Users },
                { name: "Custom Orders", path: `/manage/event/${eventId}/custom-order`, icon: ClipboardList },
            ],
        },
        {
            title: "VALIDATION",
            items: [
                { name: "Check-in Stats", path: `/manage/event/${eventId}/check-in-stats`, icon: PieChart },
                { name: "Process Check-in", path: `/manage/event/${eventId}/check-in`, icon: QrCode },
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
                className={`relative z-30 flex flex-col transition-all duration-500 ease-in-out border-r border-slate-200/50 bg-white/40 backdrop-blur-2xl shadow-2xl shadow-slate-200/20 ${isSidebarOpen ? 'w-80' : 'w-24'
                    }`}
            >
                {/* Branding Section Wrapped in Card */}
                <div className="p-4">
                    <div className={`
                        flex items-center gap-4 p-4 rounded-[2rem] transition-all duration-500
                        bg-white/40 backdrop-blur-md border border-white/20 shadow-xl shadow-slate-200/40
                        ${isSidebarOpen ? 'px-5' : 'px-2 justify-center'}
                    `}>
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/50 overflow-hidden p-2 shrink-0">
                             <img src="/Logo/Logo.png" alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
                        </div>
                        {isSidebarOpen && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col min-w-0 flex-1"
                            >
                                <span className="text-xl font-black tracking-tighter text-slate-900 leading-none italic">Event <span className="text-blue-600 not-italic">Manager</span></span>
                                <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] mt-1.5 leading-none">Campaign Control</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="px-4 py-8 pb-2">
                    {/* Event Identity Card - Simplified */}
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-100/50 rounded-2xl p-4 border border-transparent hover:border-slate-200 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200/50">
                                    <Sparkles size={14} />
                                </div>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Active Campaign</p>
                                    <h2 className="text-slate-900 font-black text-[11px] truncate uppercase tracking-tight">
                                        {eventData?.title || 'Loading...'}
                                    </h2>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Navigation Sections */}
                <nav className="flex-1 px-4 space-y-8 pb-10 mt-6 overflow-y-auto no-scrollbar">
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
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-4 h-4 flex items-center">
                                    {isSidebarOpen ? section.title : <div className="h-px bg-slate-100/50 w-full mr-4" />}
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
                                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-200'
                                                        : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
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
                                                {isSidebarOpen && (
                                                    <span className={`text-sm tracking-tight font-bold`}>
                                                        {item.name}
                                                    </span>
                                                )}

                                                {/* Active Indicator Interaction */}
                                                {isActive && isSidebarOpen && (
                                                    <motion.div 
                                                        layoutId="active-indicator"
                                                        className="ml-auto w-1.5 h-6 bg-white/40 rounded-full" 
                                                    />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Back to Hub at the very bottom */}
                <div className="px-4 pb-6 mt-auto">
                    <button
                        onClick={() => navigate('/events')}
                        className={`group flex items-center gap-4 px-4 py-3.5 ${isSidebarOpen ? 'w-full' : 'w-14 h-14 justify-center mx-auto'} bg-slate-100/50 hover:bg-white text-slate-400 hover:text-blue-600 rounded-2xl transition-all border border-transparent hover:border-blue-50 active:scale-[0.98] hover:shadow-sm`}
                    >
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-slate-100 group-hover:border-blue-200 transition-colors shadow-sm shrink-0">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        </div>
                        {isSidebarOpen && (
                            <span className="font-black text-[10px] tracking-[0.2em] uppercase whitespace-nowrap">Back to Hub</span>
                        )}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white/60 backdrop-blur-xl border-b border-white/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Layers size={20} />
                        </div>
                        <span className="font-black text-xl tracking-tighter text-slate-900 uppercase italic">Event <span className="text-blue-600 not-italic">Manager</span></span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-900 bg-white/40 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-sm">
                        <Menu size={24} />
                    </button>
                </header>

                {/* Top Header - Desktop Only */}
                <header className="h-24 flex items-center justify-between px-10 bg-white/60 backdrop-blur-xl border-b border-slate-200/30 relative z-[100]">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all active:scale-95 duration-300"
                        >
                            <ChevronRight className={`transition-transform duration-500 ${isSidebarOpen ? 'rotate-180' : ''}`} size={20} />
                        </button>
                        <div className="hidden md:flex items-center gap-4 px-6 py-3.5 bg-slate-100/50 rounded-2xl border border-transparent focus-within:bg-white focus-within:border-blue-100 focus-within:text-blue-600 focus-within:shadow-2xl focus-within:shadow-blue-500/5 transition-all duration-500 w-96 group">
                            <Search size={18} className="text-slate-400 group-focus-within:text-blue-600 group-focus-within:rotate-12 transition-all" />
                            <input 
                                type="text" 
                                placeholder="Search management features..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm font-bold w-full placeholder:text-slate-400 text-slate-800" 
                            />

                            {/* Navigation Finder Dropdown */}
                            <AnimatePresence>
                                {searchQuery && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute top-full left-0 right-0 mt-4 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-slate-100/50 overflow-hidden z-[110]"
                                    >
                                        <div className="p-4 border-b border-slate-50">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigation Finder</p>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto no-scrollbar">
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
                                                                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group/item"
                                                            >
                                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all">
                                                                    <Icon size={18} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-black text-slate-900 group-hover/item:text-blue-600 transition-colors uppercase tracking-tight">{item.name}</span>
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.path}</span>
                                                                </div>
                                                            </Link>
                                                        );
                                                    })
                                            ) : (
                                                <div className="p-8 text-center">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic animate-pulse">Feature not found</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2">
                             <div className="hidden lg:flex flex-col items-end mr-2">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">{eventData?.creators?.brand_name || 'Creator'}</span>
                                <span className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mt-1 flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-blue-600 animate-pulse" />
                                    Management Terminal
                                </span>
                             </div>
                            <div className="relative">
                                <button 
                                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                    className={`relative w-12 h-12 flex items-center justify-center border rounded-2xl transition-all duration-300 group ${isNotificationOpen ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200' : 'text-slate-400 hover:text-blue-600 hover:bg-white border-transparent hover:border-blue-50'}`}
                                >
                                    <Bell size={22} className={isNotificationOpen ? '' : 'group-hover:rotate-12 transition-transform'} />
                                </button>

                                <AnimatePresence>
                                    {isNotificationOpen && (
                                        <>
                                            <div className="fixed inset-0 z-[110]" onClick={() => setIsNotificationOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100/50 overflow-hidden z-[120] origin-top-right"
                                            >
                                                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Notifications</h3>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase">Latest Activity</p>
                                                    </div>
                                                </div>

                                                <div className="max-h-[400px] overflow-y-auto no-scrollbar p-12 text-center">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                                                        <Bell size={24} />
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Queue Clear</p>
                                                    <p className="text-[9px] font-bold text-slate-300 mt-1 italic uppercase">No new alerts</p>
                                                </div>

                                                <button 
                                                    onClick={() => setIsNotificationOpen(false)}
                                                    className="w-full p-4 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.3em] hover:bg-slate-800 transition-colors"
                                                >
                                                    Dismiss Panel
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="w-px h-8 bg-slate-200/50 mx-2" />
                            
                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className={`flex items-center gap-3 p-1.5 rounded-2xl transition-all duration-300 ${isProfileOpen ? 'bg-blue-600 shadow-xl shadow-blue-200' : 'hover:bg-white hover:shadow-sm'}`}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-sm transition-all ${isProfileOpen ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                                        {(eventData?.creators?.brand_name || 'C').charAt(0)}
                                    </div>
                                    <div className="hidden xl:flex flex-col items-start pr-2 text-left">
                                        <span className={`text-[10px] font-black uppercase tracking-tight leading-none ${isProfileOpen ? 'text-white' : 'text-slate-900'}`}>{isStaff ? 'Staff' : 'Creator'}</span>
                                        <span className={`text-[8px] font-bold mt-1 leading-none ${isProfileOpen ? 'text-blue-100' : 'text-slate-400'}`}>Authorized Access</span>
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <>
                                            <div className="fixed inset-0 z-[110]" onClick={() => setIsProfileOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 mt-4 w-64 bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100/50 overflow-hidden z-[120] origin-top-right"
                                            >
                                                <div className="p-6 bg-slate-50/50 border-b border-slate-100 italic">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Active Session</p>
                                                    <p className="text-xs font-black text-slate-900 mt-2 truncate">{user?.email}</p>
                                                </div>
                                                <div className="p-2 space-y-1">
                                                    <button 
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center gap-3 px-4 py-4 text-slate-500 hover:text-red-600 font-bold text-[11px] uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all"
                                                    >
                                                        <LogOut size={16} />
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar bg-gradient-to-br from-white to-slate-50/50">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                            transition={{ duration: 0.4, ease: "circOut" }}
                            className="max-w-[1600px] mx-auto"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default EventManagementLayout;
