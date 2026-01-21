import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../auth/useAuthStore';

const CreatorLayout = ({ children }) => {
    const { logout } = useAuthStore();
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/' },
        { name: 'Events', path: '/events' },
        { name: 'Tickets', path: '/tickets' },
        { name: 'Sales', path: '/sales' },
        { name: 'QR Scan', path: '/scan' },
        { name: 'Finance', path: '/finance' },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-orange-600">Creator Panel</h1>
                </div>
                <nav className="mt-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors ${location.pathname === item.path ? 'bg-orange-50 text-orange-600 border-r-4 border-orange-600' : ''
                                }`}
                        >
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                    <button
                        onClick={logout}
                        className="w-full flex items-center px-6 py-3 text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <span className="font-medium">Logout</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-10">
                {children}
            </main>
        </div>
    );
};

export default CreatorLayout;
