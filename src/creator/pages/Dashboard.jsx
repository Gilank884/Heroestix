import React, { useState, useEffect, useMemo } from 'react';
import useAuthStore from '../../auth/useAuthStore';
import { supabase } from '../../lib/supabaseClient';
import {
    Plus,
    Calendar,
    Ticket,
    TrendingUp,
    QrCode,
    ShieldCheck,
    Banknote,
    Sparkles,
    Maximize,
    MoreVertical,
    Activity,
    Users,
    ArrowUpRight,
    Search,
    Clock,
    Layout,
    ArrowRight,
    Trophy,
    Target,
    MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VerificationPending from '../components/VerificationPending';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Legend,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import TicketControlModal from '../components/TicketControlModal';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white shadow-2xl shadow-slate-200/50 p-6 rounded-[1.5rem] transition-all">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">{label}</p>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Ticket size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1.5">Penjualan Tiket</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white leading-none tabular-nums">
                                {payload.find(p => p.name === 'tickets')?.value || 0} <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Tiket</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const CreatorDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [events, setEvents] = useState([]);
    const [ticketsData, setTicketsData] = useState([]);
    const [dateRange, setDateRange] = useState({
        startDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
        endDate: new Date().toISOString().split('T')[0]
    });
    const [stats, setStats] = useState({
        totalEvents: 0,
        totalTickets: 0,
        totalQuota: 0,
        genderData: [],
        brand_name: ''
    });


    const [loading, setLoading] = useState(true);
    const [showControlModal, setShowControlModal] = useState(false);
    const [isVerified, setIsVerified] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchDashboardData();
        }
    }, [user?.id]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Check Verification
            const { data: creatorData } = await supabase
                .from('creators')
                .select('verified, brand_name')
                .eq('id', user.id)
                .single();

            const verified = creatorData?.verified ?? false;
            setIsVerified(verified);
            if (!verified) { setLoading(false); return; }

            // 1. Fetch Events & Taxes
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('*, ticket_types(id, price, quota, sold)')
                .eq('creator_id', user.id);

            if (eventsError) throw eventsError;

            const eventIds = eventsData?.map(e => e.id) || [];
            if (eventIds.length === 0) {
                setLoading(false);
                return;
            }

            const { data: taxesData } = await supabase
                .from('event_taxes')
                .select('*')
                .in('event_id', eventIds);

            const taxMap = {};
            taxesData?.forEach(tax => {
                taxMap[tax.event_id] = tax;
            });

            // 2. Fetch all Paid Tickets for these events
            const ttIds = [];
            eventsData.forEach(ev => {
                ev.ticket_types?.forEach(tt => ttIds.push(tt.id));
            });

            let totalRev = 0;
            let totalSold = 0;
            let ticketsForChart = [];
            let genderResult = [];

            if (ttIds.length > 0) {
                const { data: ticketsWithOrders, error: tError } = await supabase
                    .from('tickets')
                    .select(`
                        id,
                        order_id,
                        gender,
                        ticket_types!inner (id, price, event_id),
                        orders!inner (id, total, status, created_at, discount_amount)
                    `)
                    .in('ticket_type_id', ttIds)
                    .eq('orders.status', 'paid');

                if (tError) throw tError;

                if (ticketsWithOrders && ticketsWithOrders.length > 0) {
                    // Fetch order ticket counts to split discounts
                    const orderIds = [...new Set(ticketsWithOrders.map(t => t.order_id))];
                    const { data: allTicketsInOrders } = await supabase
                        .from('tickets')
                        .select('order_id')
                        .in('order_id', orderIds);

                    const orderCounts = {};
                    allTicketsInOrders?.forEach(t => {
                        orderCounts[t.order_id] = (orderCounts[t.order_id] || 0) + 1;
                    });

                    // Calculate revenue per ticket
                    const eventRevenue = {};
                    let maleCount = 0;
                    let femaleCount = 0;

                    ticketsWithOrders.forEach(t => {
                        const eventId = t.ticket_types?.event_id;
                        const eventTax = taxMap[eventId];
                        const taxRate = eventTax ? parseFloat(eventTax.value || 0) : 0;
                        const isTaxIncluded = eventTax ? eventTax.is_included : false;
                        const basePrice = Number(t.ticket_types?.price || 0);

                        let ticketIncome = basePrice;
                        if (!isTaxIncluded && taxRate > 0) {
                            ticketIncome += (basePrice * taxRate / 100);
                        }

                        const totalTicketsInOrder = orderCounts[t.order_id] || 1;
                        const discountShare = Number(t.orders?.discount_amount || 0) / totalTicketsInOrder;
                        ticketIncome -= discountShare;

                        totalRev += ticketIncome;
                        eventRevenue[eventId] = (eventRevenue[eventId] || 0) + ticketIncome;

                        // Chart data preparation
                        ticketsForChart.push({
                            created_at: t.orders.created_at,
                            amount: ticketIncome
                        });

                        // Gender stats
                        const g = t.gender?.toLowerCase();
                        if (g === 'laki - laki' || g === 'laki-laki' || g === 'male') maleCount++;
                        else if (g === 'perempuan' || g === 'female') femaleCount++;
                    });

                    totalSold = ticketsWithOrders.length;

                    // Update event calculated revenue
                    eventsData.forEach(ev => {
                        ev.calculatedRevenue = eventRevenue[ev.id] || 0;
                    });

                    if (maleCount > 0 || femaleCount > 0) {
                        genderResult = [
                            { name: 'Laki - Laki', value: maleCount, color: '#3B82F6' },
                            { name: 'Perempuan', value: femaleCount, color: '#EC4899' }
                        ];
                    }
                }
            }

            setTicketsData(ticketsForChart);
            setEvents(eventsData || []);
            setStats({
                totalEvents: eventsData?.length || 0,
                totalTickets: totalSold,
                totalRevenue: totalRev,
                genderData: genderResult,
                brand_name: creatorData?.brand_name || ''
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    // Prepare chart data for Sales Performance (Tickets Sold & Revenue per Day)
    const chartData = useMemo(() => {
        if (!ticketsData.length || !dateRange.startDate || !dateRange.endDate) return [];

        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        const days = {};

        // Pre-fill all dates in range with 0
        let current = new Date(start);
        while (current <= end) {
            const dateStr = current.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            days[dateStr] = { tickets: 0, revenue: 0 };
            current.setDate(current.getDate() + 1);
        }

        // Fill in actual sales data
        ticketsData.forEach(t => {
            const ticketDate = new Date(t.created_at);
            // Robust date check using locale strings to avoid UTC/timezone pitfalls
            if (ticketDate >= start && ticketDate <= new Date(new Date(end).setHours(23, 59, 59, 999))) {
                const dateStr = ticketDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                if (days[dateStr] !== undefined) {
                    days[dateStr].tickets += 1;
                    days[dateStr].revenue += Number(t.amount || 0);
                }
            }
        });

        return Object.entries(days).map(([name, data]) => ({
            name,
            value: data.tickets,
            revenue: Math.max(0, data.revenue)
        }));
    }, [ticketsData, dateRange]);

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
            >
                <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-blue-50 rounded-full animate-pulse" />
                </div>
            </motion.div>
        </div>
    );

    if (!isVerified) return <VerificationPending />;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative min-h-screen pb-20"
        >

            <div className="relative z-10 space-y-10">
                {/* Premium Header / Welcome Section */}
                <motion.div variants={itemVariants} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-700" />
                    <div className="relative bg-white/60 backdrop-blur-xl border border-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/20 overflow-hidden">
                        {/* Decorative internal elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl -ml-24 -mb-24" />

                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-blue-200 group/avatar overflow-hidden">
                                        {user?.profile_url ? (
                                            <img src={user.profile_url} alt="" className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <Sparkles size={40} className="animate-pulse" />
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg border-4 border-white flex items-center justify-center text-blue-600">
                                        <Trophy size={18} />
                                    </div>
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3 flex items-center justify-center md:justify-start gap-2">
                                        <Activity size={12} className="animate-pulse" /> Platform Analytics Live
                                    </p>
                                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-3">
                                        Welcome back, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.brand_name || user?.full_name?.split(' ')[0] || 'Creator'}</span>
                                    </h1>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center md:justify-start gap-2">
                                        Currently managing <span className="text-slate-900 font-black">{stats.totalEvents} active</span> operational campaigns
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4">
                                <button
                                    onClick={() => setShowControlModal(true)}
                                    className="group/btn flex items-center gap-5 px-8 py-4 bg-white/60 backdrop-blur-xl hover:bg-white rounded-[2rem] border border-white shadow-2xl shadow-slate-200/10 text-slate-900 transition-all active:scale-95"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 group-hover/btn:bg-blue-600 flex items-center justify-center text-white transition-all duration-300 shadow-lg group-hover/btn:shadow-blue-200/50">
                                        <QrCode size={20} />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/btn:text-blue-500 transition-colors">Security Check</span>
                                        <span className="block text-sm font-black uppercase tracking-widest text-slate-900">Entry Scan</span>
                                    </div>
                                    <ArrowRight size={18} className="text-slate-300 group-hover/btn:text-blue-600 group-hover/btn:translate-x-1.5 transition-all duration-300" />
                                </button>

                                <button
                                    onClick={() => navigate('/create-event')}
                                    className="group/primary h-[84px] flex items-center gap-5 px-10 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl shadow-slate-900/40 text-white hover:bg-blue-600 hover:border-blue-500 transition-all active:scale-95"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover/primary:bg-white/20 transition-colors">
                                        <Plus size={24} />
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-[0.25em]">Create Event</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Tiket Terjual', value: stats.totalTickets, icon: Ticket, color: 'blue', suffix: 'Tiket' },
                        { label: 'Pendapatan Bersih', value: stats.totalRevenue, isCurrency: true, icon: Banknote, color: 'emerald' },
                        { label: 'Operasi Aktif', value: stats.totalEvents, icon: Calendar, color: 'indigo', suffix: 'Live' }
                    ].map((s, idx) => (
                        <motion.div
                            key={idx}
                            variants={itemVariants}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className={`group relative bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/10 overflow-hidden transition-all duration-500`}
                        >
                            <div className={`absolute top-0 right-0 w-40 h-40 ${s.color === 'blue' ? 'bg-blue-500/5' : s.color === 'emerald' ? 'bg-emerald-500/5' : 'bg-indigo-500/5'} blur-[80px] rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000`} />

                            <div className="relative z-10 flex flex-col gap-8">
                                <div className={`w-16 h-16 rounded-[1.25rem] ${s.color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' : s.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'} flex items-center justify-center shadow-inner border transition-all duration-500 group-hover:rotate-6`}>
                                    <s.icon size={32} strokeWidth={1.5} />
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">{s.label}</p>
                                    <div className="flex items-baseline gap-3">
                                        <h4 className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">
                                            {s.isCurrency ? rupiah(s.value) : s.value.toLocaleString()}
                                        </h4>
                                        {s.suffix && <span className={`text-[9px] font-black ${s.color === 'blue' ? 'text-blue-600 bg-blue-50/50' : s.color === 'emerald' ? 'text-emerald-600 bg-emerald-50/50' : 'text-indigo-600 bg-indigo-50/50'} uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-current/10`}>{s.suffix}</span>}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Sales Performance Chart */}
                <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-blue-500/10 transition-colors duration-1000" />

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
                                    <TrendingUp size={16} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Sales Performance</h3>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Live analytics and breakdown
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {/* Quick Presets */}
                            <div className="flex items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/60 backdrop-blur-sm">
                                {[
                                    { label: '7D', days: 7 },
                                    { label: '30D', days: 30 },
                                    { label: 'Month', type: 'month' },
                                    { label: 'All', type: 'all' }
                                ].map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => {
                                            const end = new Date();
                                            let start = new Date();
                                            if (preset.days) {
                                                start.setDate(end.getDate() - preset.days);
                                            } else if (preset.type === 'month') {
                                                start = new Date(end.getFullYear(), end.getMonth(), 1);
                                            } else if (preset.type === 'all') {
                                                start = new Date('2024-01-01');
                                            }
                                            setDateRange({
                                                startDate: start.toISOString().split('T')[0],
                                                endDate: end.toISOString().split('T')[0]
                                            });
                                        }}
                                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all hover:bg-white hover:text-blue-600 hover:shadow-sm"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-3 bg-white/80 border border-slate-100 p-2 rounded-2xl shadow-sm backdrop-blur-md">
                                <div className="flex items-center gap-2 px-3">
                                    <Calendar size={14} className="text-slate-400" />
                                    <input
                                        type="date"
                                        value={dateRange.startDate}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="bg-transparent text-[10px] font-black text-slate-900 outline-none uppercase tracking-widest"
                                    />
                                </div>
                                <span className="text-slate-200 text-xs font-light">to</span>
                                <div className="flex items-center gap-2 px-3">
                                    <input
                                        type="date"
                                        value={dateRange.endDate}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="bg-transparent text-[10px] font-black text-slate-900 outline-none uppercase tracking-widest"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-[400px] w-full relative z-10">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 800, fill: '#94A3B8', textAnchor: 'middle' }}
                                        dy={15}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 800, fill: '#94A3B8' }}
                                        tickCount={6}
                                        domain={[0, 'auto']}
                                        allowDecimals={false}
                                    />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        name="tickets"
                                        stroke="#2563EB"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#chartGradient)"
                                        animationDuration={2500}
                                        activeDot={{ r: 8, fill: '#2563EB', strokeWidth: 4, stroke: '#fff', shadow: '0 0 20px rgba(37,99,235,0.4)' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 border border-slate-100">
                                    <TrendingUp size={40} strokeWidth={1.5} />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] italic">No Sales Data</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-[200px]">Data will populate automatically as tickets are sold.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Operations Table */}
                <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/20">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                <Layout size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Active Operations</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Managing {events.length} Live Campaigns</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto no-scrollbar -mx-4 px-4 pr-12">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                                    <th className="pb-4 pl-8 font-black">Operation Identity</th>
                                    <th className="pb-4 text-center font-black">Operational Status</th>
                                    <th className="pb-4 font-black">Event Schedule</th>
                                    <th className="pb-4 text-right font-black">Units Distribution</th>
                                    <th className="pb-4 text-right font-black">Net Revenue</th>
                                    <th className="pb-4 text-right pr-8 font-black">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="">
                                {events.length > 0 ? (
                                    events.map((ev) => (
                                        <tr key={ev.id} className="group/row">
                                            <td className="py-8 pl-10 bg-slate-50/50 group-hover/row:bg-white rounded-l-[2.5rem] border-y border-l border-transparent group-hover/row:border-slate-100 transition-all duration-500 relative">
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-600 rounded-r-full scale-0 group-hover/row:scale-100 transition-transform duration-500" />
                                                <div className="flex items-center gap-6">
                                                    <div className="w-20 h-20 rounded-[1.5rem] bg-white overflow-hidden shrink-0 border border-slate-100 shadow-2xl shadow-slate-200/50 group-hover/row:scale-105 transition-transform duration-700">
                                                        <img src={ev.poster_url || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="font-black text-slate-900 leading-tight text-lg group-hover/row:text-blue-600 transition-colors uppercase tracking-tight">{ev.title}</p>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 font-black">
                                                            <MapPin size={12} className="text-blue-500" /> {ev.location}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-8 text-center bg-slate-50/50 group-hover/row:bg-white border-y border-transparent group-hover/row:border-slate-100 transition-all duration-500">
                                                <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2 border ${ev.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    ev.status === 'draft' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                                        'bg-blue-50 text-blue-600 border-blue-100'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${ev.status === 'active' ? 'bg-emerald-500' : ev.status === 'draft' ? 'bg-slate-400' : 'bg-blue-500'}`} />
                                                    {ev.status}
                                                </span>
                                            </td>
                                            <td className="py-8 bg-slate-50/50 group-hover/row:bg-white border-y border-transparent group-hover/row:border-slate-100 transition-all duration-500">
                                                <div className="space-y-1.5">
                                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{new Date(ev.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 bg-white/50 w-fit px-2 py-1 rounded-lg border border-slate-100"><Clock size={12} className="text-blue-500" /> {ev.event_time}</p>
                                                </div>
                                            </td>
                                            <td className="py-8 text-right bg-slate-50/50 group-hover/row:bg-white border-y border-transparent group-hover/row:border-slate-100 transition-all duration-500">
                                                <div className="flex flex-col items-end gap-3 pr-4">
                                                    <p className="text-sm font-black text-slate-900 tabular-nums tracking-tighter">
                                                        {ev.ticket_types?.reduce((acc, curr) => acc + (curr.sold || 0), 0)} <span className="text-slate-400 font-bold text-[10px] ml-1 uppercase tracking-widest leading-none">/ {ev.ticket_types?.reduce((acc, curr) => acc + (curr.quota || 0), 0)} Units Sold</span>
                                                    </p>
                                                    <div className="w-32 bg-slate-200/50 h-2 rounded-full overflow-hidden p-0.5 shadow-inner">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(ev.ticket_types?.reduce((acc, curr) => acc + (curr.sold || 0), 0) / ev.ticket_types?.reduce((acc, curr) => acc + (curr.quota || 0), 0)) * 100 || 0}%` }}
                                                            className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-8 text-right font-black text-blue-600 tabular-nums text-lg bg-slate-50/50 group-hover/row:bg-white border-y border-transparent group-hover/row:border-slate-100 transition-all duration-500 pr-10">
                                                {rupiah(ev.calculatedRevenue || 0)}
                                            </td>
                                            <td className="py-8 text-right pr-10 bg-slate-50/50 group-hover/row:bg-white rounded-r-[2.5rem] border-y border-r border-transparent group-hover/row:border-slate-100 transition-all duration-500">
                                                <button
                                                    onClick={() => navigate(`/manage/event/${ev.id}`)}
                                                    className="inline-flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 shadow-lg shadow-slate-200/20 group/action"
                                                >
                                                    Deploy <ArrowUpRight size={14} className="group-hover/action:translate-x-0.5 group-hover/action:-translate-y-0.5 transition-transform" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-24 text-center bg-slate-50/50 rounded-[2.5rem]">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-200 shadow-sm">
                                                    <Maximize size={32} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] italic">No campaigns deployed</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-[250px] mx-auto">Click 'Create Event' to start your first operational campaign.</p>
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

            <TicketControlModal isOpen={showControlModal} onClose={() => setShowControlModal(false)} />
        </motion.div>
    );
};

export default CreatorDashboard;
