import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import useAuthStore from '../../auth/useAuthStore';
import {
    BarChart3,
    TrendingUp,
    Ticket,
    ArrowDownLeft,
    Search,
    Filter,
    ArrowUpRight,
    Calendar,
    Sparkles,
    Activity,
    RefreshCw,
    Wallet,
    LayoutGrid,
    Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import VerificationPending from '../components/VerificationPending';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function Overview() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({
        totalTickets: 0,
        totalEvents: 0,
        totalRevenue: 0,
        ticketsSold: 0
    });
    const [isVerified, setIsVerified] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user?.id) {
            fetchSalesData();
        }
    }, [user?.id]);

    const fetchSalesData = async () => {
        setLoading(true);
        try {
            // Check Verification
            const { data: creatorData } = await supabase
                .from('creators')
                .select('verified')
                .eq('id', user.id)
                .single();

            const verified = creatorData?.verified ?? false;
            setIsVerified(verified);
            if (!verified) { setLoading(false); return; }

            // 1. Fetch all events for this creator
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false });

            if (eventsError) throw eventsError;

            // 2. Fetch all tickets and their associated orders for these events
            const eventIds = eventsData.map(e => e.id);
            let ticketsWithOrders = [];
            let taxMap = {};

            if (eventIds.length > 0) {
                const [tRes, taxRes] = await Promise.all([
                    supabase
                        .from('tickets')
                        .select(`
                            id,
                            order_id,
                            orders!inner (id, total, status, discount_amount),
                            ticket_types!inner (id, price, event_id)
                        `)
                        .in('ticket_types.event_id', eventIds)
                        .eq('orders.status', 'paid'),
                    supabase.from('event_taxes').select('*').in('event_id', eventIds)
                ]);

                if (tRes.error) throw tRes.error;
                ticketsWithOrders = tRes.data || [];

                taxRes.data?.forEach(t => {
                    taxMap[t.event_id] = t;
                });
            }

            // 3. Aggregate stats using Fair-Share Logic
            // We need to know the total number of tickets in EACH order to split revenue fairly
            const orderIdsOverall = [...new Set(ticketsWithOrders.map(t => t.order_id))];
            let orderTicketCounts = {};

            if (orderIdsOverall.length > 0) {
                const { data: allTicketsInOrders } = await supabase
                    .from('tickets')
                    .select('order_id')
                    .in('order_id', orderIdsOverall);

                allTicketsInOrders?.forEach(t => {
                    orderTicketCounts[t.order_id] = (orderTicketCounts[t.order_id] || 0) + 1;
                });
            }

            const eventStats = eventsData.map(event => {
                const ticketsInEvent = ticketsWithOrders.filter(t => t.ticket_types.event_id === event.id);
                const ticketsSold = ticketsInEvent.length;

                // Calculate revenue based on each ticket's share of its order
                let totalRevenue = 0;
                ticketsInEvent.forEach(t => {
                    const totalInOrder = orderTicketCounts[t.order_id] || 1;
                    const ticketType = t.ticket_types;
                    const eventTax = taxMap[ticketType.event_id];

                    const basePrice = Number(ticketType.price || 0);
                    const taxRate = eventTax ? parseFloat(eventTax.value || 0) : 0;
                    const isTaxIncluded = eventTax ? eventTax.is_included : false;

                    let ticketIncome = basePrice;
                    if (!isTaxIncluded && taxRate > 0) {
                        ticketIncome += (basePrice * taxRate / 100);
                    }

                    const discountShare = Number(t.orders.discount_amount || 0) / totalInOrder;
                    ticketIncome -= discountShare;

                    totalRevenue += ticketIncome;
                });

                const today = new Date().toISOString().split('T')[0];
                const eventDate = event.event_date ? event.event_date.split('T')[0] : '';
                const isActive = event.status === 'active' && eventDate >= today;

                return {
                    id: event.id,
                    title: event.title,
                    banner: event.poster_url,
                    ticketsSold,
                    totalRevenue,
                    status: isActive ? 'Aktif' : 'Berakhir',
                    date: event.event_date
                };
            });

            // Overall Stats
            const totalTicketsAll = ticketsWithOrders.length;
            const totalRevenueAll = eventStats.reduce((acc, curr) => acc + curr.totalRevenue, 0);

            setStats({
                totalRevenue: totalRevenueAll,
                ticketsSold: totalTicketsAll,
                totalEvents: eventsData.length
            });
            setHistory(eventStats || []);
        } catch (error) {
            console.error('Error fetching overview data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredHistory = history.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <div className="relative">
                    <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
                <div className="space-y-1 text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Synchronizing Reports</span>
                </div>
            </div>
        );
    }

    if (!isVerified) return <VerificationPending />;

    return (
        <div className="relative min-h-screen pb-20">
            <motion.div
                className="relative z-10 space-y-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header Overhaul - Unified Glassmorphism Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-8"
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                                Financial Reports
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Laporan Penjualan</span>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                                Sales Overview <TrendingUp className="text-blue-600" size={32} />
                            </h1>
                            <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                                Analisis performa penjualan tiket kamu secara mendalam, pantau pertumbuhan pendapatan bersih, dan distribusi per event.
                            </p>
                        </div>
                    </div>

                    <motion.button
                        onClick={fetchSalesData}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.25rem] shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all group shrink-0"
                    >
                        <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                        Refresh Laporan
                    </motion.button>
                </motion.div>

                {/* Metrics Overview - Unified Divided Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        {[
                            { label: 'Total Kampanye', value: stats.totalEvents, icon: LayoutGrid, color: 'blue', suffix: 'Semua Event' },
                            { label: 'Tiket Terjual', value: stats.ticketsSold.toLocaleString(), icon: Ticket, color: 'purple', suffix: 'Total Paid' },
                            { label: 'Pendapatan Bersih', value: rupiah(stats.totalRevenue), icon: Wallet, color: 'emerald', suffix: 'Net Revenue' }
                        ].map((stat, idx) => (
                            <div key={idx} className={`flex items-start gap-6 ${idx > 0 ? 'md:pl-12' : ''} ${idx < 2 ? 'pb-8 md:pb-0' : 'pt-8 md:pt-0'}`}>
                                <div className={`w-14 h-14 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center text-${stat.color}-600 shrink-0`}>
                                    <stat.icon size={28} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">{stat.label}</p>
                                    <h4 className={`text-2xl md:text-3xl font-black text-slate-900 tabular-nums tracking-tighter`}>
                                        {stat.value}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1 h-1 rounded-full bg-${stat.color}-500`} />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.suffix}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Operations Section */}
                <div className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-black text-slate-900 tracking-tight uppercase">Performa Per Event</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Penjualan</span>
                        </div>
                        <div className="relative group w-full md:w-80">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-blue-600 transition-colors">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari laporan event..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/60 backdrop-blur-xl border border-white focus:border-blue-500 rounded-[1.25rem] py-3.5 pl-14 pr-4 text-[11px] font-black uppercase outline-none text-slate-700 placeholder:text-slate-300 transition-all shadow-xl shadow-slate-200/40"
                            />
                        </div>
                    </div>

                    <motion.div
                        variants={itemVariants}
                        className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Nama Event & Metadata</th>
                                        <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Tickets Sold</th>
                                        <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Market Status</th>
                                        <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Revenue Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredHistory.length > 0 ? filteredHistory.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 group transition-all duration-300">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 relative group-hover:scale-105 transition-transform duration-500">
                                                        {item.banner ? (
                                                            <img
                                                                src={item.banner}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <Calendar size={20} strokeWidth={1.5} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-sm font-black text-slate-900 tracking-tight uppercase group-hover:text-blue-600 transition-colors">{item.title}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">ID: {item.id.substring(0, 8)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-lg font-black text-slate-900 tabular-nums tracking-tighter">{item.ticketsSold.toLocaleString()}</span>
                                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Paid Tickets</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className={`mx-auto inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${item.status === 'Aktif'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-slate-50 text-slate-400 border-slate-100'
                                                    }`}>
                                                    {item.status}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex flex-col items-end">
                                                    <p className="text-sm font-black text-slate-900 tracking-tighter uppercase">{rupiah(item.totalRevenue)}</p>
                                                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Available for payout</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-24 text-center">
                                                <div className="flex flex-col items-center gap-4 py-10">
                                                    <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center border border-slate-100 mb-2">
                                                        <Search size={32} strokeWidth={1} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Records Missing</h3>
                                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Adjust search filters to view specific data.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
