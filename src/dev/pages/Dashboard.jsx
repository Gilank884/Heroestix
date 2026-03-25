import React, { useState, useEffect, useMemo } from 'react';
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
    RefreshCw,
    Filter,
    Check
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const DevDashboard = () => {
    const [stats, setStats] = useState({
        totalCreators: 0,
        totalEvents: 0
    });
    const [performanceData, setPerformanceData] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [selectedCreators, setSelectedCreators] = useState([]);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreatorFilter, setShowCreatorFilter] = useState(false);

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Core Totals
            const [creatorsRes, eventsRes, profilesRes, ticketsRes] = await Promise.all([
                supabase.from('creators').select('*'),
                supabase.from('events').select('*'),
                supabase.from('profiles').select('id, full_name'),
                supabase.from('tickets')
                    .select('id, created_at, order_id, orders!inner(id, total, status, created_at, discount_amount), ticket_types!inner(id, price, events!inner(id, creator_id))')
                    .eq('orders.status', 'paid')
                    .gte('orders.created_at', dateRange.startDate)
                    .lte('orders.created_at', dateRange.endDate + 'T23:59:59')
            ]);

            if (creatorsRes.error) throw creatorsRes.error;

            const creators = creatorsRes.data || [];
            const events = eventsRes.data || [];
            const profiles = profilesRes.data || [];
            const paidTickets = ticketsRes.data || [];

            const profileMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

            const { data: allTaxes } = await supabase.from('event_taxes').select('*');
            const taxMap = (allTaxes || []).reduce((acc, t) => ({ ...acc, [t.event_id]: t }), {});

            // Process Chart Data
            const chartMapping = {};
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            let curr = new Date(start);

            // Pre-fill dates AND creators with 0
            while (curr <= end) {
                const dateISO = curr.toISOString().split('T')[0];
                const dLabel = curr.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                chartMapping[dateISO] = { name: dLabel, dateKey: dateISO };

                // Set 0 for ALL creators on this day
                creators.forEach(c => {
                    const cName = c.brand_name || 'Anonymous';
                    chartMapping[dateISO][cName] = 0;
                });

                curr.setDate(curr.getDate() + 1);
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

            const revenueByCreator = {};
            const ticketsSoldByCreator = {};

            paidTickets.forEach(t => {
                const countInOrder = orderTicketCounts[t.order_id] || 1;
                const ticketType = t.ticket_types;
                const eventTax = taxMap[ticketType.events?.id];

                const basePrice = Number(ticketType.price || 0);
                const taxRate = eventTax ? parseFloat(eventTax.value || 0) : 0;
                const isTaxIncluded = eventTax ? eventTax.is_included : false;

                let ticketIncome = basePrice;
                if (!isTaxIncluded && taxRate > 0) {
                    ticketIncome += (basePrice * taxRate / 100);
                }

                const discountShare = Number(t.orders.discount_amount || 0) / countInOrder;
                ticketIncome -= discountShare;

                const cId = ticketType?.events?.creator_id;
                if (cId) {
                    revenueByCreator[cId] = (revenueByCreator[cId] || 0) + ticketIncome;
                    ticketsSoldByCreator[cId] = (ticketsSoldByCreator[cId] || 0) + 1;

                    // Chart Aggregation - Use YYYY-MM-DD from order timestamp
                    const dateISO = new Date(t.orders.created_at).toISOString().split('T')[0];
                    const creator = creators.find(c => c.id === cId);
                    const creatorName = creator?.brand_name || 'Anonymous';

                    if (chartMapping[dateISO]) {
                        chartMapping[dateISO][creatorName] = (chartMapping[dateISO][creatorName] || 0) + 1;
                    }
                }
            });

            // Sort chart data by date to ensure the line is drawn correctly
            const sortedChartData = Object.values(chartMapping).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
            setChartData(sortedChartData);

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

    const COLORS = [
        '#2563EB', '#7C3AED', '#EC4899', '#10B981', '#F59E0B',
        '#6366F1', '#8B5CF6', '#D946EF', '#F97316', '#14B8A6'
    ];

    const allCreators = useMemo(() => {
        const keys = new Set();
        chartData.forEach(day => {
            Object.keys(day).forEach(key => {
                if (key !== 'name' && key !== 'dateKey') keys.add(key);
            });
        });
        return Array.from(keys);
    }, [chartData]);

    const creatorsInChart = useMemo(() => {
        if (selectedCreators.length === 0) return allCreators;
        return allCreators.filter(c => selectedCreators.includes(c));
    }, [allCreators, selectedCreators]);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Aggregating Performance Matrix...</span>
        </div>
    );

    return (
        <div className="space-y-10 pb-10">
            {/* Header section */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <img src="/Logo/Logo.png" alt="Heroestix" className="h-8 w-auto" />
                            <div className="w-1 h-6 bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Intelligence Engine</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-medium tracking-tight text-slate-900 italic">Platform <span className="text-blue-600 not-italic">Matrix</span></h1>
                        <p className="text-slate-500 font-medium text-sm mt-2">Synthesizing ecosystem data into actionable performance metrics.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Date Presets and Inputs */}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="flex items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/60 backdrop-blur-sm shadow-sm ring-1 ring-black/5">
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
                                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            (preset.type === 'month' && dateRange.startDate === new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <Calendar size={14} className="text-slate-400" />
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="bg-transparent border-none outline-none text-xs font-medium text-slate-600 w-28 cursor-pointer"
                                />
                                <span className="text-slate-300 mx-1">—</span>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="bg-transparent border-none outline-none text-xs font-medium text-slate-600 w-28 cursor-pointer"
                                />
                            </div>
                        </div>

                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all active:scale-95 shadow-sm"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Sync Data
                        </button>
                    </div>
                </div>
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

            {/* Sales Chart Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group"
            >
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-100">
                                <TrendingUp size={18} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Network Sales Performance</h3>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Combined Ticket Sales by Creator
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Creator Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowCreatorFilter(!showCreatorFilter)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedCreators.length > 0
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-100'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <Filter size={12} />
                                {selectedCreators.length === 0 ? 'All Creators' : `${selectedCreators.length} Selected`}
                                <ArrowUpRight size={12} className={`transition-transform ${showCreatorFilter ? 'rotate-180' : 'rotate-90'}`} />
                            </button>

                            <AnimatePresence>
                                {showCreatorFilter && (
                                    <>
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => setShowCreatorFilter(false)}
                                            className="fixed inset-0 z-10"
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute right-0 mt-3 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl z-20 overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Creators</span>
                                                <button
                                                    onClick={() => {
                                                        if (selectedCreators.length === allCreators.length) setSelectedCreators([]);
                                                        else setSelectedCreators([...allCreators]);
                                                    }}
                                                    className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                                                >
                                                    {selectedCreators.length === allCreators.length ? 'Unselect All' : 'Select All'}
                                                </button>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto p-2 no-scrollbar">
                                                {allCreators.map((creator, i) => (
                                                    <button
                                                        key={creator}
                                                        onClick={() => {
                                                            setSelectedCreators(prev =>
                                                                prev.includes(creator)
                                                                    ? prev.filter(c => c !== creator)
                                                                    : [...prev, creator]
                                                            );
                                                        }}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedCreators.length === 0 || selectedCreators.includes(creator)
                                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                                : 'border-slate-300 group-hover:border-blue-400'
                                                            }`}>
                                                            {(selectedCreators.length === 0 || selectedCreators.includes(creator)) && <Check size={10} strokeWidth={4} />}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                            <span className="text-xs font-bold text-slate-700">{creator}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                            <span>{new Date(dateRange.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                            <ArrowUpRight size={12} className="rotate-90 opacity-30" />
                            <span>{new Date(dateRange.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        </div>
                    </div>
                </div>

                <div className="h-[350px] w-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    {creatorsInChart.map((creator, i) => (
                                        <linearGradient key={creator} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.1} />
                                            <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '1rem',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        padding: '12px'
                                    }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    wrapperStyle={{
                                        paddingBottom: '30px',
                                        fontSize: '10px',
                                        fontWeight: '900',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em'
                                    }}
                                />
                                {creatorsInChart.map((creator, i) => (
                                    <Area
                                        key={creator}
                                        type="monotone"
                                        dataKey={creator}
                                        stroke={COLORS[i % COLORS.length]}
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill={`url(#grad-${i})`}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <Activity size={48} className="text-slate-300 mb-4" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] italic">No sales data in this period</p>
                        </div>
                    )}
                </div>
            </motion.div>

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
