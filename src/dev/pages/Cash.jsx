import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Wallet, Search, Filter, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, Building2, TrendingUp, RefreshCw, ShoppingBag, CreditCard, Activity, AlertCircle, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function Cash() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({ totalGross: 0, totalNet: 0, disbursed: 0 });
    const [settlements, setSettlements] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Try fetching from Edge Function first for server-side aggregation
            try {
                const { data, error: edgeError } = await supabase.functions.invoke('get-admin-financials', {
                    body: { startDate, endDate }
                });
                if (!edgeError && data) {
                    setMetrics(data.metrics);
                    setSettlements(data.settlements);
                    setWithdrawals(data.withdrawals || []);
                    setLoading(false);
                    return;
                }
                console.warn('Edge Function returned error or no data, falling back to client-side calc:', edgeError);
            } catch (efErr) {
                console.warn('Edge Function invoke failed, falling back:', efErr);
            }

            // 2. Fallback Logic (Client-side aggregation with Fair-Share Logic)
            const [creatorsRes, profilesRes, ticketsRes, withdrawalsRes] = await Promise.all([
                supabase.from('creators').select('*'),
                supabase.from('profiles').select('id, full_name, email'),
                supabase.from('tickets').select('id, order_id, orders!inner(id, total, status, created_at), ticket_types!inner(events!inner(creator_id))').eq('orders.status', 'paid'),
                supabase.from('withdrawals').select('*')
            ]);

            if (creatorsRes.error) throw creatorsRes.error;
            if (profilesRes.error) throw profilesRes.error;
            if (ticketsRes.error) throw ticketsRes.error;
            if (withdrawalsRes.error) throw withdrawalsRes.error;

            const creators = creatorsRes.data || [];
            const profiles = profilesRes.data || [];
            const allTickets = ticketsRes.data || [];
            let allWithdrawals = withdrawalsRes.data || [];

            // Client-side date filtering
            let paidTickets = allTickets;
            if (startDate || endDate) {
                const start = startDate ? new Date(startDate) : new Date(0);
                const end = endDate ? new Date(endDate) : new Date();
                if (endDate && endDate.length <= 10) end.setHours(23, 59, 59, 999); // Set to end of day for inclusive filtering

                paidTickets = allTickets.filter(t => {
                    const date = new Date(t.orders.created_at);
                    return date >= start && date <= end;
                });

                allWithdrawals = allWithdrawals.filter(w => {
                    const date = new Date(w.created_at);
                    return date >= start && date <= end;
                });
            }

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

            // Maps for fast lookups
            const profileMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
            const creatorMap = creators.reduce((acc, c) => ({
                ...acc,
                [c.id]: { ...c, profile: profileMap[c.id] }
            }), {});

            let totalGross = 0;
            let totalNet = 0;
            const revenueByCreator = {};
            const grossByCreator = {};

            // Calculate revenue per ticket fairly
            paidTickets.forEach(t => {
                const countInOrder = orderTicketCounts[t.order_id] || 1;
                const shareOfGross = Number(t.orders.total) / countInOrder;
                const net = shareOfGross - 8500;

                totalNet += net;

                const creatorId = t.ticket_types?.events?.creator_id;
                if (creatorId) {
                    grossByCreator[creatorId] = (grossByCreator[creatorId] || 0) + shareOfGross;
                    revenueByCreator[creatorId] = (revenueByCreator[creatorId] || 0) + net;
                }
            });

            // Unique paid order totals for Gross
            const uniqueOrderTotals = new Map();
            paidTickets.forEach(t => {
                uniqueOrderTotals.set(t.order_id, Number(t.orders.total));
            });
            totalGross = Array.from(uniqueOrderTotals.values()).reduce((a, b) => a + b, 0);

            const disbursed = allWithdrawals
                .filter(w => w.status === 'approved')
                .reduce((sum, w) => sum + Number(w.amount || 0), 0);

            // Per Creator Settlements
            const creatorSettlements = creators.map(creator => {
                const cGross = grossByCreator[creator.id] || 0;
                const cNet = revenueByCreator[creator.id] || 0;
                return {
                    id: creator.id,
                    brandName: creator.brand_name || profileMap[creator.id]?.full_name || 'Anonymous',
                    ownerName: profileMap[creator.id]?.full_name || 'Anonymous Owner',
                    grossRevenue: cGross,
                    revenue: cNet,
                    developerProfit: cGross - cNet,
                    disbursed: allWithdrawals
                        .filter(w => w.creator_id === creator.id && w.status === 'approved')
                        .reduce((sum, w) => sum + Number(w.amount || 0), 0)
                };
            })
                .filter(s => s.revenue > 0 || s.disbursed > 0)
                .sort((a, b) => b.revenue - a.revenue);

            setMetrics({ totalGross, totalNet, disbursed });
            setSettlements(creatorSettlements);
            setWithdrawals(allWithdrawals.map(w => ({ ...w, creators: creatorMap[w.creator_id] })).slice(0, 50));

        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message || 'Failed to fetch financial data from database.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && settlements.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest animate-pulse">Syncing Database Ledger...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-2">
                    <AlertCircle size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Gagal Memuat Data</h3>
                <p className="text-sm text-slate-500 max-w-xs">{error}</p>
                <button
                    onClick={fetchData}
                    className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium active:scale-95 transition-all"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    // Final Calculations for UI
    const totalDevProfit = metrics.totalGross - metrics.totalNet;
    const pendingDisbursement = metrics.totalNet - metrics.disbursed;

    const filteredSettlements = settlements.filter(s =>
        s.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.ownerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Live Database Treasury</span>
                    </div>
                    <h1 className="text-4xl font-medium tracking-tight text-slate-900 italic">Platform <span className="text-blue-600 not-italic">Cash</span></h1>
                    <p className="text-slate-500 font-medium text-sm mt-2">Treasury management and creator settlement metrics (Direct Access).</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <Calendar size={14} className="text-slate-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs font-medium text-slate-600 w-28"
                        />
                        <span className="text-slate-300 mx-1">—</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs font-medium text-slate-600 w-28"
                        />
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 transition-all active:scale-95 shadow-sm"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Sync Data
                    </button>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 p-6 rounded-2xl text-white relative overflow-hidden group border border-white/5 shadow-2xl shadow-slate-900/10"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg">
                            <TrendingUp size={28} />
                        </div>
                        <div>
                            <p className="text-blue-400 text-[10px] font-medium uppercase tracking-widest mb-1">Total Developer Profit</p>
                            <h3 className="text-4xl font-medium tracking-tighter tabular-nums">{rupiah(totalDevProfit)}</h3>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6 relative group overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                    <div className="relative z-10 w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                        <Wallet size={28} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest mb-1">Total Belum Dicairkan</p>
                        <h3 className="text-4xl font-medium text-slate-900 tracking-tighter tabular-nums">{rupiah(pendingDisbursement)}</h3>
                    </div>
                </motion.div>
            </div>

            {/* Minor Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                            <ShoppingBag size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Total Gross Revenue</p>
                            <p className="text-xl font-medium text-slate-700">{rupiah(metrics.totalGross)}</p>
                        </div>
                    </div>
                    <div className="text-xs font-medium text-slate-300 italic">Database Sum</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Total Net Platform</p>
                            <p className="text-xl font-medium text-slate-700">{rupiah(metrics.totalNet)}</p>
                        </div>
                    </div>
                    <div className="text-xs font-medium text-slate-300 italic">Net Aggregated</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-10">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                            <Building2 size={20} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 tracking-tight">Creator Settlement Ledger</h3>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 focus-within:bg-white focus-within:border-blue-400 focus-within:text-blue-500 transition-all w-full md:w-80 shadow-sm">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Filter by creator..."
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
                                <th className="px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Creator</th>
                                <th className="px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest text-right">Total Gross</th>
                                <th className="px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest text-right">Net Revenue</th>
                                <th className="px-8 py-5 text-[10px] font-medium text-blue-600 uppercase tracking-widest text-right">Dev Profit</th>
                                <th className="px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest text-right">Disbursed</th>
                                <th className="px-8 py-5 text-[10px] font-medium text-slate-400 uppercase tracking-widest text-right">Remaining Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredSettlements.map((s, idx) => (
                                <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.02 }}
                                    key={s.id}
                                    className="group hover:bg-slate-50/50 transition-colors"
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 font-medium text-sm shadow-sm">
                                                {s.brandName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 text-sm tracking-tight">{s.brandName}</p>
                                                <p className="text-[10px] font-medium text-slate-400 italic">Owner: {s.ownerName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right font-medium text-slate-400 tabular-nums text-xs">
                                        {rupiah(s.grossRevenue)}
                                    </td>
                                    <td className="px-6 py-5 text-right font-medium text-slate-900 tabular-nums">
                                        {rupiah(s.revenue)}
                                    </td>
                                    <td className="px-6 py-5 text-right font-bold text-blue-600 tabular-nums">
                                        {rupiah(s.developerProfit || (s.grossRevenue - s.revenue))}
                                    </td>
                                    <td className="px-6 py-5 text-right font-medium text-emerald-600 tabular-nums">
                                        {rupiah(s.disbursed)}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-medium text-slate-900 tabular-nums">{rupiah(s.revenue - s.disbursed)}</span>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className={`w-1 h-1 rounded-full ${s.revenue - s.disbursed > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-200'}`} />
                                                <span className={`text-[8px] font-medium uppercase tracking-widest ${s.revenue - s.disbursed > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                                                    {s.revenue - s.disbursed > 0 ? 'Payable' : 'Cleared'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                            {filteredSettlements.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center text-slate-400 text-sm italic font-medium">
                                        No settlement data found in database.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
