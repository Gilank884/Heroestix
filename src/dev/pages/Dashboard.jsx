import React from 'react';

const DevDashboard = () => {
    const stats = [
        { label: 'Total Users', value: '15,420', color: 'text-blue-400' },
        { label: 'Total Creators', value: '245', color: 'text-purple-400' },
        { label: 'Total Events', value: '1,120', color: 'text-green-400' },
        { label: 'Platform Revenue', value: 'Rp 124.500.000', color: 'text-blue-400' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-4xl font-extrabold tracking-tight">System Overview</h2>
                <p className="text-gray-400 mt-2">Global performance and statistics for Hai-Ticket platform.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
                        <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{stat.label}</p>
                        <p className={`text-3xl font-bold mt-4 ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
                    <h3 className="text-xl font-bold mb-6">Pending Creator Approvals</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                            <div>
                                <p className="font-bold">Indie Studio</p>
                                <p className="text-sm text-gray-500">indie@studio.com</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition">Approve</button>
                                <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition">Details</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
                    <h3 className="text-xl font-bold mb-6">Recent Transactions</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-gray-500 text-xs font-bold uppercase border-b border-gray-800">
                                    <th className="pb-4">Order ID</th>
                                    <th className="pb-4">Creator</th>
                                    <th className="pb-4">Status</th>
                                    <th className="pb-4 text-right">Fee</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                <tr className="text-sm">
                                    <td className="py-4">#ORD-2026-X1</td>
                                    <td className="py-4">Star Events</td>
                                    <td className="py-4">
                                        <span className="bg-green-500/10 text-green-500 px-2.5 py-1 rounded text-xs font-bold ring-1 ring-inset ring-green-500/20">Success</span>
                                    </td>
                                    <td className="py-4 text-right font-mono text-blue-400">Rp 15.000</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DevDashboard;
