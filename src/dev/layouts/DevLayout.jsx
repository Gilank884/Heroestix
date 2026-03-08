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
    LogOut,
    ChevronRight,
    Search,
    Bell,
    Settings,
    User
} from 'lucide-react';
import useAuthStore from '../../auth/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

const DevLayout = ({ children }) => {
    const { logout, user } = useAuthStore();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Creators', path: '/creators', icon: Users },
        { name: 'Events', path: '/events', icon: Calendar },
        { name: 'Cash', path: '/cash', icon: CreditCard },
        { name: 'Withdrawals', path: '/withdrawals', icon: Wallet },
    ];

    return (
        <div className="flex h-screen bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-700">
            {/* Sidebar */}
            <aside
                className={`relative z-20 flex flex-col transition-all duration-500 ease-in-out border-r border-slate-200 bg-white shadow-sm ${isSidebarOpen ? 'w-72' : 'w-20'
                    }`}
            >
                {/* Logo Section */}
                <div className="h-20 flex items-center px-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
                            <ShieldAlert className="text-white" size={20} />
                        </div>
                        {isSidebarOpen && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col"
                            >
                                <span className="text-lg font-black tracking-tighter text-slate-900 leading-none uppercase">Admin Console</span>
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Global Systems</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 mt-8 px-4 space-y-1.5 overflow-y-auto no-scrollbar">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${isActive
                                    ? 'bg-blue-50 text-blue-600 font-bold'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <item.icon
                                    size={20}
                                    className={`transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                                />
                                {isSidebarOpen && (
                                    <span className="text-sm tracking-tight">{item.name}</span>
                                )}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-nav"
                                        className="absolute right-3 w-1.5 h-1.5 bg-blue-600 rounded-full"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Profile / Bottom Section */}
                <div className="p-4 border-t border-slate-100 bg-white">
                    {isSidebarOpen ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-bold overflow-hidden shadow-sm uppercase">
                                    {user?.user_metadata?.avatar_url ? (
                                        <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        user?.email?.charAt(0) || 'A'
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-black text-slate-900 truncate tracking-tight uppercase">System Operator</span>
                                    <span className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{user?.email}</span>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-500 hover:text-red-600 font-bold text-xs uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all whitespace-nowrap"
                            >
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center py-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                            <LogOut size={20} />
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
                {/* Header */}
                <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all active:scale-95"
                        >
                            <ChevronRight className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} size={18} />
                        </button>
                        <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 focus-within:bg-white focus-within:border-blue-400 focus-within:text-blue-500 focus-within:shadow-sm transition-all w-80">
                            <Search size={16} />
                            <input type="text" placeholder="Search resources..." className="bg-transparent border-none outline-none text-sm font-medium w-full placeholder:text-slate-400 text-slate-800" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="relative w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
                        </button>
                        <div className="w-px h-6 bg-slate-100 mx-2" />
                        <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                            <Settings size={20} />
                        </button>
                    </div>
                </header>

                {/* Main */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
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
