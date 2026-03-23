import React, { useState, useEffect, useMemo } from 'react';
import useAuthStore from '../../auth/useAuthStore';
import { supabase } from '../../lib/supabaseClient';
import {
    HiPlus,
    HiCalendar,
    HiTicket,
    HiTrendingUp,
    HiQrcode,
    HiShieldCheck,
    HiCash,
    HiSparkles,
    HiArrowsExpand,
    HiDotsVertical
} from 'react-icons/hi';
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
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl shadow-blue-500/10 transition-all">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">{label}</p>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                        <div>
                            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Tickets Sold</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white leading-none">
                                {payload.find(p => p.name === 'tickets')?.value || 0} <span className="text-slate-400 font-medium">Units</span>
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
        genderData: []
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
                .select('verified')
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
                genderData: genderResult
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
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!isVerified) return <VerificationPending />;

    return (
        <div className="space-y-6 pb-20">
            {/* Quick Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
                <div className="bg-white px-6 py-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1.5">Tickets Sold</p>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{stats.totalTickets.toLocaleString()}</h4>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <HiTicket size={24} />
                    </div>
                </div>
                <div className="bg-white px-6 py-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-colors">
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1.5">Net Revenue</p>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{rupiah(stats.totalRevenue)}</h4>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <HiCash size={24} />
                    </div>
                </div>
                <div className="bg-white px-6 py-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1.5">Active Operations</p>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{stats.totalEvents}</h4>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <HiCalendar size={24} />
                    </div>
                </div>
            </div>

            {/* Sales Performance Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-blue-500/10 transition-colors" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 relative z-10">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Sales Performance</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" /> Tickets Sold
                        </p>
                    </div>
 
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Quick Presets */}
                        <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-200/60">
                            {[
                                { label: '7D', days: 7 },
                                { label: '30D', days: 30 },
                                { label: 'This Month', type: 'month' },
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
                                            start = new Date(end.getFullYear(), end.getDate() === 0 ? end.getMonth() -1 : end.getMonth(), 1);
                                        } else if (preset.type === 'all') {
                                            start = new Date('2024-01-01'); // Project start or very early
                                        }
                                        setDateRange({
                                            startDate: start.toISOString().split('T')[0],
                                            endDate: end.toISOString().split('T')[0]
                                        });
                                    }}
                                    className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all hover:text-blue-600"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                className="bg-transparent text-[10px] font-black text-slate-600 outline-none px-2 py-1 uppercase"
                            />
                            <span className="text-slate-300 text-xs">/</span>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                className="bg-transparent text-[10px] font-black text-slate-600 outline-none px-2 py-1 uppercase"
                            />
                        </div>

                        <div className="flex items-center gap-3 ml-2">
                             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 translate-y-[-2px] active:translate-y-[0px] transition-all">
                                <HiTrendingUp size={24} />
                             </div>
                        </div>
                    </div>
                </div>

                <div className="h-[380px] w-full relative z-10">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.01} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#F1F5F9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fontWeight: 600, fill: '#94A3B8' }}
                            dy={15}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fontWeight: 600, fill: '#94A3B8' }}
                            tickCount={6}
                            domain={[0, 'auto']}
                            allowDecimals={false}
                        />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#CBD5E1', strokeWidth: 1 }} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            name="tickets"
                            stroke="#2563EB"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#chartGradient)"
                            animationDuration={2000}
                            activeDot={{ r: 6, fill: '#2563EB', strokeWidth: 4, stroke: '#fff' }}
                        />
                    </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                <HiTrendingUp size={32} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest opacity-60 italic">Belum ada data penjualan harian</p>
                                <p className="text-[10px] text-slate-400 font-medium">Data akan otomatis muncul di sini setelah tiket mulai terjual.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Operations Table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h3 className="text-2xl font-medium text-slate-900 tracking-tight">Active Operations</h3>
                        <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Managing {events.length} Live Campaigns</p>
                    </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-400 text-[10px] uppercase tracking-[0.2em] border-b border-slate-100">
                                <th className="pb-6 pl-4">Operation Identity</th>
                                <th className="pb-6 text-center">Operational Status</th>
                                <th className="pb-6">Event Schedule</th>
                                <th className="pb-6 text-right">Units Distribution</th>
                                <th className="pb-6 text-right">Net Revenue</th>
                                <th className="pb-6 text-right pr-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {events.length > 0 ? (
                                events.map((ev) => (
                                    <tr key={ev.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-8 pl-4">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 rounded-[1.25rem] bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-sm group-hover:scale-105 transition-transform duration-500">
                                                    <img src={ev.poster_url || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 leading-tight text-lg group-hover:text-blue-600 transition-colors uppercase tracking-tight">{ev.title}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1.5 uppercase tracking-widest flex items-center gap-1.5">
                                                        <HiTrendingUp className="text-blue-500" /> {ev.location}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-8 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest inline-block ${ev.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                                ev.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                                                    'bg-indigo-100 text-indigo-700'
                                                }`}>
                                                {ev.status}
                                            </span>
                                        </td>
                                        <td className="py-8">
                                            <p className="text-sm font-medium text-slate-900 uppercase tracking-tight">{new Date(ev.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{ev.event_time}</p>
                                        </td>
                                        <td className="py-8 text-right">
                                            <div className="flex flex-col items-end gap-2 text-right">
                                                <p className="text-sm font-black text-slate-900 tabular-nums">
                                                    {ev.ticket_types?.reduce((acc, curr) => acc + (curr.sold || 0), 0)} <span className="text-slate-400 font-medium">/ {ev.ticket_types?.reduce((acc, curr) => acc + (curr.quota || 0), 0)}</span>
                                                </p>
                                                <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                                        style={{ width: `${(ev.ticket_types?.reduce((acc, curr) => acc + (curr.sold || 0), 0) / ev.ticket_types?.reduce((acc, curr) => acc + (curr.quota || 0), 0)) * 100 || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-8 text-right font-black text-[#1b3bb6] tabular-nums text-base">
                                            {rupiah(ev.calculatedRevenue || 0)}
                                        </td>
                                        <td className="py-8 text-right pr-4">
                                            <button
                                                onClick={() => navigate(`/manage/event/${ev.id}`)}
                                                className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 shadow-sm"
                                            >
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <HiArrowsExpand size={48} />
                                            <p className="text-xs uppercase tracking-[0.2em]">No operations deployed</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <TicketControlModal isOpen={showControlModal} onClose={() => setShowControlModal(false)} />
        </div>
    );
};

export default CreatorDashboard;
