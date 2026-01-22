import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { HiUserGroup, HiIdentification, HiCalendar, HiCash } from 'react-icons/hi';

const DevDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCreators: 0,
        totalEvents: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);
    const [pendingCreators, setPendingCreators] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);

    useEffect(() => {
        fetchDevData();
    }, []);

    const fetchDevData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Stats
            const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: creatorCount } = await supabase.from('creators').select('*', { count: 'exact', head: true });
            const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
            const { data: transData } = await supabase.from('transactions').select('amount');

            const totalRevenue = transData?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

            setStats({
                totalUsers: userCount || 0,
                totalCreators: creatorCount || 0,
                totalEvents: eventCount || 0,
                totalRevenue: totalRevenue
            });

            // 2. Fetch Pending Creators
            const { data: pending } = await supabase
                .from('creators')
                .select('*')
                .eq('verified', false)
                .order('created_at', { ascending: false });

            setPendingCreators(pending || []);

            // 3. Fetch Recent Transactions
            const { data: recent } = await supabase
                .from('transactions')
                .select('*, orders(user_id)')
                .order('created_at', { ascending: false })
                .limit(5);

            setRecentTransactions(recent || []);

        } catch (error) {
            console.error('Error fetching dev data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveCreator = async (creatorId) => {
        try {
            const { error } = await supabase
                .from('creators')
                .update({ verified: true })
                .eq('id', creatorId);

            if (error) throw error;
            alert('Creator approved successfully!');
            fetchDevData();
        } catch (error) {
            alert('Error approving creator: ' + error.message);
        }
    };

    const rupiah = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const statsConfig = [
        { label: 'Total Users', value: stats.totalUsers.toLocaleString(), color: 'text-blue-400', icon: HiUserGroup },
        { label: 'Total Creators', value: stats.totalCreators.toLocaleString(), color: 'text-purple-400', icon: HiIdentification },
        { label: 'Total Events', value: stats.totalEvents.toLocaleString(), color: 'text-green-400', icon: HiCalendar },
        { label: 'Platform Revenue', value: rupiah(stats.totalRevenue), color: 'text-blue-400', icon: HiCash },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h2 className="text-4xl font-extrabold tracking-tight text-white">System <span className="text-cyan-500">Overview</span></h2>
                <p className="text-gray-400 mt-2">Global performance and statistics for Hai-Ticket platform.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {statsConfig.map((stat) => (
                    <div key={stat.label} className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800 shadow-2xl hover:border-cyan-500/50 transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-gray-500 text-xs font-black uppercase tracking-widest">{stat.label}</p>
                            <stat.icon className="text-gray-700 group-hover:text-cyan-500 transition-colors" size={20} />
                        </div>
                        <p className={`text-3xl font-black mt-4 ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12 xl:col-span-5 bg-gray-900 p-8 rounded-[2rem] border border-gray-800">
                    <h3 className="text-xl font-black mb-6 text-white uppercase tracking-tight">Pending Creator Approvals</h3>
                    <div className="space-y-4">
                        {pendingCreators.length > 0 ? pendingCreators.map((creator) => (
                            <div key={creator.id} className="flex items-center justify-between p-6 bg-gray-800/30 rounded-3xl border border-gray-700/50 hover:bg-gray-800/50 transition-colors">
                                <div>
                                    <p className="font-black text-white">{creator.brand_name || 'Unnamed Creator'}</p>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter mt-1">{creator.email || 'No email'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApproveCreator(creator.id)}
                                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-900/40"
                                    >
                                        Verify
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-600 text-center py-12 font-bold italic">No pending applications.</p>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-12 xl:col-span-7 bg-gray-900 p-8 rounded-[2rem] border border-gray-800">
                    <h3 className="text-xl font-black mb-6 text-white uppercase tracking-tight">Live Transaction Feed</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-800">
                                    <th className="pb-4">Transaction ID</th>
                                    <th className="pb-4">Order Ref</th>
                                    <th className="pb-4">Status</th>
                                    <th className="pb-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {recentTransactions.length > 0 ? recentTransactions.map((tx) => (
                                    <tr key={tx.id} className="group hover:bg-gray-800/20 transition-colors">
                                        <td className="py-5">
                                            <p className="text-xs font-mono text-gray-400">TX-{tx.id.substring(0, 8).toUpperCase()}</p>
                                        </td>
                                        <td className="py-5">
                                            <p className="text-xs font-black text-white">ORD-{tx.order_id.substring(0, 8).toUpperCase()}</p>
                                        </td>
                                        <td className="py-5">
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${tx.status === 'success' ? 'bg-green-500/10 text-green-500 ring-1 ring-green-500/20' : 'bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="py-5 text-right">
                                            <p className="text-sm font-black text-cyan-400">{rupiah(tx.amount)}</p>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-gray-600 font-bold italic">No transactions found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DevDashboard;
