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
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl shadow-blue-500/10 active:scale-95 transition-all">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{label}</p>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                        {payload[0].value} <span className="text-slate-400 font-medium">Units</span>
                    </p>
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
    const [stats, setStats] = useState({
        totalEvents: 0,
        totalTickets: 0,
        totalQuota: 0,
        totalRevenue: 0,
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

            // Fetch Events & Transactions
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('*, ticket_types(price, quota, sold)')
                .eq('creator_id', user.id);

            if (eventsError) throw eventsError;

            // Fetch Tickets with joined Orders to calculate revenue
            const eventIds = eventsData.map(e => e.id);
            let totalRev = 0;
            let ticketsDataForDemographics = [];

            if (eventIds.length > 0) {
                const { data: ticketsWithOrders, error: tError } = await supabase
                    .from('tickets')
                    .select(`
                        id,
                        created_at,
                        gender,
                        order_id,
                        orders!inner (id, total, status),
                        ticket_types!inner (event_id)
                    `)
                    .in('ticket_types.event_id', eventIds)
                    .eq('orders.status', 'paid');

                if (tError) throw tError;

                if (ticketsWithOrders && ticketsWithOrders.length > 0) {
                    // To handle orders with multiple tickets fairly:
                    // 1. Get all unique order IDs
                    const orderIds = [...new Set(ticketsWithOrders.map(t => t.order_id))];

                    // 2. Fetch total ticket count for EACH of these orders (to split revenue)
                    const { data: allTicketsInOrders } = await supabase
                        .from('tickets')
                        .select('order_id')
                        .in('order_id', orderIds);

                    const orderTicketCounts = {};
                    allTicketsInOrders?.forEach(t => {
                        orderTicketCounts[t.order_id] = (orderTicketCounts[t.order_id] || 0) + 1;
                    });

                    // 3. Calculate revenue: (Order Total / Total Tickets) - 8500 per ticket
                    let calculatedTotalRev = 0;
                    ticketsWithOrders.forEach(t => {
                        const totalTicketsInOrder = orderTicketCounts[t.order_id] || 1;
                        const shareOfGross = Number(t.orders.total) / totalTicketsInOrder;
                        calculatedTotalRev += (shareOfGross - 8500);
                    });

                    totalRev = calculatedTotalRev;
                    ticketsDataForDemographics = ticketsWithOrders;
                    setTicketsData(ticketsWithOrders);
                }
            }

            setEvents(eventsData);

            // Calculate Stats
            let totalSold = 0;
            eventsData?.forEach(ev => {
                ev.ticket_types?.forEach(tt => {
                    totalSold += tt.sold || 0;
                });
            });

            // Demographics using already fetched data
            let genderResult = [];
            if (ticketsDataForDemographics.length > 0) {
                let maleCount = 0;
                let femaleCount = 0;

                ticketsDataForDemographics.forEach(ticket => {
                    const g = ticket.gender?.toLowerCase();
                    if (g === 'laki - laki' || g === 'laki-laki' || g === 'male') maleCount++;
                    else if (g === 'perempuan' || g === 'female') femaleCount++;
                });

                if (maleCount > 0 || femaleCount > 0) {
                    genderResult = [
                        { name: 'Laki - Laki', value: maleCount, color: '#3B82F6' },
                        { name: 'Perempuan', value: femaleCount, color: '#EC4899' }
                    ];
                }
            }
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

    // Prepare chart data for Sales Performance (Tickets Sold per Day)
    const chartData = useMemo(() => {
        if (!ticketsData.length) return [];
        const days = {};
        ticketsData.forEach(t => {
            const date = new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            // Each record in tickets represents a ticket sale
            days[date] = (days[date] || 0) + 1;
        });
        return Object.entries(days).map(([name, value]) => ({ name, value })).slice(-7);
    }, [ticketsData]);

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!isVerified) return <VerificationPending />;

    return (
        <div className="space-y-6 pb-20">
            {/* Dashboard Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Overview Table */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-medium text-slate-900 tracking-tight">Overview</h3>
                            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Key Performance Indicators</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left bg-slate-50/50 rounded-2xl overflow-hidden border border-slate-100">
                            <thead>
                                <tr className="text-slate-400 text-[10px] uppercase tracking-[0.2em] border-b border-slate-100 bg-white">
                                    <th className="py-5 pl-6 font-semibold">Active Campaigns</th>
                                    <th className="py-5 font-semibold">Tickets Sold</th>
                                    <th className="py-5 pr-6 font-semibold text-right">Net Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="py-6 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <HiCalendar size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-lg">{stats.totalEvents}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Live Operations</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <HiTicket size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-lg">{stats.totalTickets.toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Units Distributed</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 pr-6 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="text-right">
                                                <p className="font-bold text-slate-900 text-lg">{rupiah(stats.totalRevenue)}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Available Balance</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <HiCash size={20} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Demographics Area */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-medium text-slate-900 tracking-tight">Demografi</h3>
                            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Distribusi Gender</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full flex items-center justify-center min-h-[200px]">
                        {stats.genderData && stats.genderData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={stats.genderData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {stats.genderData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                        formatter={(val) => [`${val} Orang`, 'Total']}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center space-y-2 opacity-50">
                                <HiArrowsExpand size={32} className="mx-auto text-slate-300" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Belum ada data<br />demografi pengunjung</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Sales Performance Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-blue-500/10 transition-colors" />

                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div>
                        <h3 className="text-2xl font-medium text-slate-900 tracking-tight">Sales Performance</h3>
                        <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Harian Penjualan Tiket</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end mr-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth</p>
                            <p className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                <HiTrendingUp /> +14.2%
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                            <HiTrendingUp size={24} />
                        </div>
                    </div>
                </div>

                <div className="h-[380px] w-full relative z-10">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
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
                                    stroke="#2563EB"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#chartGradient)"
                                    animationDuration={2000}
                                    dot={(props) => {
                                        const { cx, cy, index } = props;
                                        if (index === chartData.length - 1) {
                                            return (
                                                <g key="last-dot">
                                                    <circle cx={cx} cy={cy} r={8} fill="#2563EB" fillOpacity={0.2} />
                                                    <circle cx={cx} cy={cy} r={4} fill="#2563EB" stroke="#fff" strokeWidth={2} />
                                                </g>
                                            );
                                        }
                                        return null;
                                    }}
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
                                <th className="pb-6 text-right pr-4">Units Sold / Quota</th>
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
                                        <td className="py-8 text-right pr-4">
                                            <p className="text-sm font-medium text-slate-900">
                                                {ev.ticket_types?.reduce((acc, curr) => acc + (curr.sold || 0), 0)} / {ev.ticket_types?.reduce((acc, curr) => acc + (curr.quota || 0), 0)}
                                            </p>
                                            <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden ml-auto mt-3">
                                                <div
                                                    className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                                    style={{ width: `${(ev.ticket_types?.reduce((acc, curr) => acc + (curr.sold || 0), 0) / ev.ticket_types?.reduce((acc, curr) => acc + (curr.quota || 0), 0)) * 100 || 0}%` }}
                                                />
                                            </div>
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
