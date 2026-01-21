import React, { useState } from 'react';
import useAuthStore from '../../auth/useAuthStore';

const CreatorDashboard = () => {
    const { user } = useAuthStore();

    // Mock data for initial implementation
    const stats = [
        { label: 'Total Events', value: '12', color: 'bg-blue-500' },
        { label: 'Total Tickets Sold', value: '1,245', color: 'bg-green-500' },
        { label: 'Total Revenue', value: 'Rp 45.200.000', color: 'bg-orange-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">Welcome back, {user?.name || 'Creator'}!</h2>
                <button className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition">
                    Create New Event
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold mt-2 text-gray-900">{stat.value}</p>
                        <div className={`h-1 w-12 mt-4 rounded-full ${stat.color}`}></div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold mb-4">Recent Sales</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-gray-400 text-sm uppercase">
                                <th className="pb-4 font-semibold">Event</th>
                                <th className="pb-4 font-semibold">Buyer</th>
                                <th className="pb-4 font-semibold">Ticket</th>
                                <th className="pb-4 font-semibold">Status</th>
                                <th className="pb-4 font-semibold text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            <tr className="text-gray-700 hover:bg-gray-50 transition">
                                <td className="py-4">Music Fest 2026</td>
                                <td className="py-4">John Doe</td>
                                <td className="py-4 font-medium">VIP Pass</td>
                                <td className="py-4">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Paid</span>
                                </td>
                                <td className="py-4 text-right font-bold">Rp 750.000</td>
                            </tr>
                            {/* More mock rows can go here */}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CreatorDashboard;
