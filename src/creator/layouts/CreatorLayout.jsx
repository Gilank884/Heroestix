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
    ArrowRight,
    ChevronRight,
    SearchCheck,
    Cpu,
    Boxes
} from 'lucide-react';
import useAuthStore from '../../auth/useAuthStore';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

const CreatorLayout = ({ children }) => {
    const { user, logout } = useAuthStore();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({ brand_name: 'Loading Data...' });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Live Clock Update
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDateTime = (date) => {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        const dateStr = date.toLocaleDateString('en-US', options);
        const timeStr = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        logout();
    };

    const navSections = [
        {
            title: "Performance",
            icon: BarChart3,
            items: [
                { name: "Dashboard", path: "/", icon: LayoutDashboard },
                { name: "Event Analytics", path: "/events", icon: Sparkles },
                { name: "Sales Overview", path: "/sales-report", icon: TrendingUp },
            ],
        },
        {
            title: "Management",
            icon: Users,
            items: [
                { name: "Creator Profile", path: "/profile", icon: User },
                { name: "Withdrawals", path: "/withdrawals", icon: Wallet },
            ],
        }
    ];

    return (
        <div className="flex h-screen bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-700">
            {/* Sidebar with Glassmorphism */}
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
                                className="flex flex-col min-w-0"
                            >
                                <span className="text-xl font-black tracking-tighter text-slate-900 leading-none italic">Creator <span className="text-blue-600 not-italic">Portal</span></span>
                                <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] mt-1.5 leading-none">Merchant Systems</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 mt-8 px-5 space-y-8 overflow-y-auto no-scrollbar pb-10">
                    {navSections.map((section) => (
                        <div key={section.title} className="space-y-3">
                            {isSidebarOpen ? (
                                <div className="flex items-center gap-2 px-4">
                                    <section.icon size={12} className="text-blue-600/50" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{section.title}</span>
                                </div>
                            ) : (
                                <div className="h-px bg-slate-100/50 mx-4 my-2" />
                            )}
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            className={`group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 relative ${isActive
                                                ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 font-bold'
                                                : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                                                }`}
                                        >
                                            <item.icon
                                                size={20}
                                                className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`}
                                            />
                                            {isSidebarOpen && (
                                                <span className="text-sm tracking-tight font-bold">{item.name}</span>
                                            )}
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
                    ))}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
                {/* Global Header with Minimalist Glassmorphism */}
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
                            <input type="text" placeholder="Omni Search Resources..." className="bg-transparent border-none outline-none text-sm font-bold w-full placeholder:text-slate-400 text-slate-800" />
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2">
                             <div className="hidden lg:flex flex-col items-end mr-2">
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">{stats.brand_name || 'Creator'}</span>
                                <span className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mt-1 flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-blue-600 animate-pulse" />
                                    Live Terminal
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
                            <button className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-blue-50 rounded-2xl transition-all duration-300 group">
                                <Settings size={22} className="group-hover:rotate-90 transition-transform duration-700" />
                            </button>
                            
                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className={`flex items-center gap-3 p-1.5 rounded-2xl transition-all duration-300 ${isProfileOpen ? 'bg-blue-600 shadow-xl shadow-blue-200' : 'hover:bg-white hover:shadow-sm'}`}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-sm transition-all ${isProfileOpen ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                                        {stats.image_url ? (
                                            <img src={stats.image_url} alt="Profile" className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            stats.brand_name?.charAt(0).toUpperCase() || 'C'
                                        )}
                                    </div>
                                    <div className="hidden xl:flex flex-col items-start pr-2 text-left">
                                        <span className={`text-[10px] font-black uppercase tracking-tight leading-none ${isProfileOpen ? 'text-white' : 'text-slate-900'}`}>Creator</span>
                                        <span className={`text-[8px] font-bold mt-1 leading-none ${isProfileOpen ? 'text-blue-100' : 'text-slate-400'}`}>Merchant Account</span>
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
                                                    <Link 
                                                        to="/profile"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-blue-600 font-bold text-[11px] uppercase tracking-widest hover:bg-blue-50 rounded-2xl transition-all"
                                                    >
                                                        <User size={16} />
                                                        Manage Profile
                                                    </Link>
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

                {/* Main Content with Optimized Spacing */}
                <main className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar bg-gradient-to-br from-white to-slate-50/50">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                            transition={{ duration: 0.4, ease: "circOut" }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default CreatorLayout;
