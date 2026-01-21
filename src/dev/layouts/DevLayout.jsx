import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../auth/useAuthStore';

const DevLayout = ({ children }) => {
    const { logout } = useAuthStore();
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/' },
        { name: 'Creators', path: '/creators' },
        { name: 'Events', path: '/events' },
        { name: 'Transactions', path: '/transactions' },
        { name: 'Platform Fee', path: '/fee' },
        { name: 'Withdrawals', path: '/withdrawals' },
        { name: 'Audit Logs', path: '/logs' },
    ];

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 shadow-xl border-r border-gray-700">
                <div className="p-6 border-b border-gray-700">
                    <h1 className="text-2xl font-bold text-blue-400">Dev Admin</h1>
                </div>
                <nav className="mt-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${location.pathname === item.path ? 'bg-gray-700 text-white border-r-4 border-blue-400' : ''
                                }`}
                        >
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                    <button
                        onClick={logout}
                        className="w-full flex items-center px-6 py-3 text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                        <span className="font-medium">Logout</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-10 bg-gray-950">
                {children}
            </main>
        </div>
    );
};

export default DevLayout;
