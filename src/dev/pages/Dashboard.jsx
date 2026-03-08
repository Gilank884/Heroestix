import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Users,
    Calendar,
    ArrowUpRight,
    Activity,
    ShoppingBag,
    TrendingUp,
    Building2,
    Search,
    RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

const DevDashboard = () => {
    const [stats, setStats] = useState({
        totalCreators: 0,
        totalEvents: 0
    });
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Core Totals
            const [creatorsRes, eventsRes, profilesRes, ticketsRes] = await Promise.all([
                supabase.from('creators').select('*'),
                supabase.from('events').select('*'),
                supabase.from('profiles').select('id, full_name'),
                supabase.from('tickets').select('id, order_id, orders!inner(id, total, status), ticket_types!inner(events!inner(creator_id))').eq('orders.status', 'paid')
            ]);

            if (creatorsRes.error) throw creatorsRes.error;

            const creators = creatorsRes.data || [];
            const events = eventsRes.data || [];
            const profiles = profilesRes.data || [];
            const paidTickets = ticketsRes.data || [];

            // 2. Prepare Maps and Fair-Share Revenue
            const profileMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

            const orderIds = [...new Set(paidTickets.map(t => t.order_id))];
            let orderTicketCounts = {};
            if (orderIds.length > 0) {
                const { data: countData } = await supabase
                    .from('tickets')
                    .select('order_id')
                    .in('order_id', orderIds);
                countData?.forEach(t => {
                    orderTicketCounts[t.order_id] = (orderTicketCounts[t.order_id] || 0) + 1;
                });
            }

            const revenueByCreator = {};
            const ticketsSoldByCreator = {};

            paidTickets.forEach(t => {
                const countInOrder = orderTicketCounts[t.order_id] || 1;
                const share = Number(t.orders.total) / countInOrder;
                const net = share - 8500;

                const cId = t.ticket_types?.events?.creator_id;
                if (cId) {
                    revenueByCreator[cId] = (revenueByCreator[cId] || 0) + net;
                    ticketsSoldByCreator[cId] = (ticketsSoldByCreator[cId] || 0) + 1;
                }
            });

            // 3. Aggregate Performance per Creator
            const creatorPerformance = creators.map(creator => {
                const creatorEvents = events.filter(ev => ev.creator_id === creator.id);
                return {
                    id: creator.id,
                    brandName: creator.brand_name || 'Anonymous',
                    ownerName: profileMap[creator.id]?.full_name || 'Anonymous Owner',
                    eventCount: creatorEvents.length,
                    totalSold: ticketsSoldByCreator[creator.id] || 0,
                    revenue: revenueByCreator[creator.id] || 0,
                    email: creator.email
                };
            }).sort((a, b) => b.revenue - a.revenue);

            setStats({
                totalCreators: creators.length,
                totalEvents: events.length
            });
            setPerformanceData(creatorPerformance);

        } catch (error) {
            console.error('Error fetching dashboard data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const rupiah = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const filteredPerformance = performanceData.filter(p =>
        p.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Aggregating Performance Matrix...</span>
        </div>
    );

    return (
        <div className="space-y-10 pb-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Executive Summary</span>
                    </div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 italic">Platform <span className="text-blue-600 not-italic">Matrix</span></h2>
                    <p className="text-slate-500 font-medium text-sm mt-2">Real-time creator performance and network scalability metrics.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all active:scale-95 shadow-sm"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Sync Data
                </button>
            </div>

            {/* Core Stats Grid (Simplified) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6"
                >
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                        <Building2 size={28} />
                    </div>
                    <div>
                        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Active Creators</h3>
                        <p className="text-4xl font-bold text-slate-900 mt-1 tracking-tighter">{stats.totalCreators.toLocaleString()}</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6"
                >
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Global Event Volume</h3>
                        <p className="text-4xl font-bold text-slate-900 mt-1 tracking-tighter">{stats.totalEvents.toLocaleString()}</p>
                    </div>
                </motion.div>
            </div>

            {/* Performance Matrix Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Creator Performance Index</h3>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 focus-within:bg-white focus-within:border-blue-400 focus-within:text-blue-500 transition-all w-full md:w-80 shadow-sm">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Filter by brand or owner..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium w-full placeholder:text-slate-400 text-slate-800"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Creator Entity</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hosted Events</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tickets Sold</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Net Revenue (Inc. Tax)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredPerformance.map((p, idx) => (
                                <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.03 }}
                                    key={p.id}
                                    className="group hover:bg-slate-50/50 transition-colors"
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm group-hover:border-blue-200 transition-all">
                                                {p.brandName.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-sm uppercase tracking-tight group-hover:text-blue-600 transition-colors">{p.brandName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Owner:</span>
                                                    <span className="text-[10px] font-bold text-slate-500 italic">{p.ownerName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-bold text-slate-900">{p.eventCount}</span>
                                            <span className="text-[9px] font-black text-slate-300 uppercase mt-0.5">Listings</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                                                <ShoppingBag size={12} />
                                                <span className="text-[11px] font-bold">{p.totalSold.toLocaleString()}</span>
                                            </div>
                                            <span className="text-[9px] font-black text-slate-300 uppercase mt-1.5">Volume</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg font-bold text-slate-900 tabular-nums">{rupiah(p.revenue)}</span>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Settled Balance</span>
                                            </div>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}

                            {filteredPerformance.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-30">
                                            <Activity size={48} className="text-slate-300 mb-4" />
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] italic">No performance data captured</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Matrix updated: <span className="text-slate-900">{new Date().toLocaleString()}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Real-time Feed Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DevDashboard;
