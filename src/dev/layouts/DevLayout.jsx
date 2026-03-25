import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Calendar,
    CreditCard,
    Percent,
    Wallet,
    ShieldAlert,
    Activity,
    LogOut,
    ChevronRight,
    Search,
    Bell,
    Settings,
    User,
    FileText,
    ClipboardList,
    Layout,
    Cpu,
    Boxes,
    TrendingUp,
    Download,
    Image as ImageIcon
} from 'lucide-react';
import useAuthStore from '../../auth/useAuthStore';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

const DevLayout = ({ children }) => {
    const { logout, user } = useAuthStore();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    React.useEffect(() => {
        fetchNotifications();
        // Set up real-time subscription if needed, or just poll
        const interval = setInterval(fetchNotifications, 30000); // 30s poll
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            // Fetch Pending Withdrawals
            const { data: withdrawals } = await supabase
                .from('withdrawals')
                .select('id, amount, created_at, creators(brand_name)')
                .eq('status', 'pending')
                .limit(5);

            // Fetch Unverified Creators
            const { data: creators } = await supabase
                .from('creators')
                .select('id, brand_name, created_at')
                .eq('verified', false)
                .limit(5);

            const unified = [
                ...(withdrawals || []).map(w => ({
                    id: `wd-${w.id}`,
                    type: 'withdrawal',
                    title: 'Withdrawal Request',
                    desc: `${w.creators?.brand_name} requested payout`,
                    time: w.created_at,
                    link: '/withdrawals'
                })),
                ...(creators || []).map(c => ({
                    id: `cr-${c.id}`,
                    type: 'verification',
                    title: 'New Creator Audit',
                    desc: `${c.brand_name} registration`,
                    time: c.created_at,
                    link: `/creators/${c.id}`
                }))
            ].sort((a, b) => new Date(b.time) - new Date(a.time));

            setNotifications(unified);
            setUnreadCount(unified.length);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        logout();
    };

    const navSections = [
        {
            title: "Core Operations",
            icon: Cpu,
            items: [
                { name: 'Dashboard', path: '/', icon: LayoutDashboard },
                { name: 'Events', path: '/events', icon: Calendar },
                { name: 'Creators', path: '/creators', icon: Users },
                { name: 'Banners', path: '/banners', icon: ImageIcon },
            ]
        },
        {
            title: "Financial Matrix",
            icon: Activity,
            items: [
                { name: 'Cash', path: '/cash', icon: CreditCard },
                { name: 'Withdrawals', path: '/withdrawals', icon: Wallet },
                { name: 'Tax', path: '/tax', icon: Percent },
                { name: 'Transactions', path: '/transactions', icon: Activity },
            ]
        },
        {
            title: "Logistics & Audit",
            icon: Boxes,
            items: [
                { name: 'Custom Orders', path: '/custom-orders', icon: ClipboardList },
                { name: 'Documents', path: '/documents', icon: FileText },
            ]
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
                                <span className="text-xl font-black tracking-tighter text-slate-900 leading-none italic">Dev <span className="text-blue-600 not-italic">Portal</span></span>
                                <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] mt-1.5 leading-none">Administrative View</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 mt-8 px-5 space-y-8 overflow-y-auto no-scrollbar pb-10">
                    {navSections.map((section, sIdx) => (
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
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Production Vault</span>
                                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    Live Sync Active
                                </span>
                             </div>
                            <div className="relative">
                                <button 
                                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                    className={`relative w-12 h-12 flex items-center justify-center border rounded-2xl transition-all duration-300 group ${isNotificationOpen ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200' : 'text-slate-400 hover:text-blue-600 hover:bg-white border-transparent hover:border-blue-50'}`}
                                >
                                    <Bell size={22} className={isNotificationOpen ? '' : 'group-hover:rotate-12 transition-transform'} />
                                    {unreadCount > 0 && (
                                        <span className={`absolute top-3.5 right-3.5 w-2.5 h-2.5 rounded-full ring-4 shadow-lg animate-pulse ${isNotificationOpen ? 'bg-white ring-blue-600' : 'bg-blue-600 ring-white'}`} />
                                    )}
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
                                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Admin Alerts</h3>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase">System Action Required</p>
                                                    </div>
                                                    {unreadCount > 0 && (
                                                        <span className="px-2 py-1 bg-blue-600 text-white text-[9px] font-black rounded-lg uppercase tracking-wider">
                                                           {unreadCount} New
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                                                    {notifications.length > 0 ? (
                                                        notifications.map((n) => (
                                                            <Link
                                                                key={n.id}
                                                                to={n.link}
                                                                onClick={() => setIsNotificationOpen(false)}
                                                                className="flex items-start gap-4 p-5 hover:bg-white transition-all border-b border-slate-50 last:border-none group"
                                                            >
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                                    n.type === 'withdrawal' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                                                                }`}>
                                                                    {n.type === 'withdrawal' ? <Wallet size={18} /> : <ShieldAlert size={18} />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[11px] font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{n.title}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 mt-1 line-clamp-2 leading-relaxed">{n.desc}</p>
                                                                    <p className="text-[8px] font-black text-slate-300 uppercase mt-2 tracking-widest">
                                                                        {new Date(n.time).toLocaleDateString()} • {new Date(n.time).toLocaleTimeString()}
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        ))
                                                    ) : (
                                                        <div className="p-12 text-center">
                                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                                                                <Bell size={24} />
                                                            </div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Queue Clear</p>
                                                            <p className="text-[9px] font-bold text-slate-300 mt-1 italic uppercase">All systems nominal</p>
                                                        </div>
                                                    )}
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
                                        {user?.user_metadata?.avatar_url ? (
                                            <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            user?.email?.charAt(0).toUpperCase() || 'A'
                                        )}
                                    </div>
                                    <div className="hidden xl:flex flex-col items-start pr-2">
                                        <span className={`text-[10px] font-black uppercase tracking-tight leading-none ${isProfileOpen ? 'text-white' : 'text-slate-900'}`}>Operator</span>
                                        <span className={`text-[8px] font-bold mt-1 leading-none ${isProfileOpen ? 'text-blue-100' : 'text-slate-400'}`}>Systems Control</span>
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
                                                <div className="p-2">
                                                    <button 
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center gap-3 px-4 py-4 text-slate-500 hover:text-red-600 font-bold text-[11px] uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all"
                                                    >
                                                        <LogOut size={16} />
                                                        Sign Out Systems
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

export default DevLayout;
