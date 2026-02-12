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
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
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

const CreatorDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [events, setEvents] = useState([]);
    const [balances, setBalances] = useState([]);
    const [stats, setStats] = useState({
        totalEvents: 0,
        totalTickets: 0,
        totalQuota: 0,
        fillRate: 0
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
            const [eventsRes, balancesRes] = await Promise.all([
                supabase.from('events').select('*, ticket_types(price, quota, sold)').eq('creator_id', user.id),
                supabase.from('creator_balances').select('*').eq('creator_id', user.id).eq('type', 'credit')
            ]);

            const eventsData = eventsRes.data || [];
            const balancesData = balancesRes.data || [];

            setEvents(eventsData);
            setBalances(balancesData);

            // Calculate Stats
            let totalSold = 0;
            let totalRev = balancesData.reduce((acc, curr) => {
                // Subtract platform fee (8500) from each ticket sale credit
                return acc + (Number(curr.amount) - 8500);
            }, 0);

            eventsData?.forEach(ev => {
                ev.ticket_types?.forEach(tt => {
                    totalSold += tt.sold || 0;
                });
            });

            setStats({
                totalEvents: eventsData?.length || 0,
                totalTickets: totalSold,
                totalRevenue: totalRev
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    // Prepare chart data for Sales Performance (Tickets Sold per Day)
    const chartData = useMemo(() => {
        if (!balances.length) return [];
        const days = {};
        balances.forEach(b => {
            const date = new Date(b.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            // Each credit in creator_balances represents a ticket sale transaction
            days[date] = (days[date] || 0) + 1;
        });
        return Object.entries(days).map(([name, value]) => ({ name, value })).slice(-7);
    }, [balances]);

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!isVerified) return <VerificationPending />;

    return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-8 text-white shadow-2xl shadow-blue-900/10 border border-white/5">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                            <HiSparkles size={12} className="text-blue-300" />
                            <span className="text-[10px] uppercase tracking-[0.2em] text-blue-100">Operation Center</span>
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-blue-200 tracking-tight">
                                Core Console
                            </h2>
                            <p className="text-slate-300 max-w-lg mt-3 text-lg leading-relaxed">
                                Pantau operasional publik dan performa real-time event.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Active Operations"
                    value={stats.totalEvents}
                    unit="Campaigns"
                    icon={<HiCalendar size={24} />}
                    color="blue"
                    grow={`${stats.totalEvents} Live`}
                />
                <StatCard
                    label="Tickets Distributed"
                    value={stats.totalTickets.toLocaleString()}
                    unit="Units Sold"
                    icon={<HiTicket size={24} />}
                    color="emerald"
                    grow="Verified Check-ins"
                />
                <StatCard
                    label="Net Revenue"
                    value={rupiah(stats.totalRevenue)}
                    unit="Payout Balance"
                    icon={<HiCash size={24} />}
                    color="indigo"
                    grow="Collected Funds"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-8">
                {/* Sales Performance Chart */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-medium text-slate-900 tracking-tight">Sales Performance</h3>
                            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Daily Ticket Sales</p>
                        </div>
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                            <HiTrendingUp size={20} />
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                                        tickCount={5}
                                        domain={[0, 'auto']}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                                        formatter={(val) => [`${val} Units`, 'Tickets Sold']}
                                        cursor={{ stroke: '#E2E8F0', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                        dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6, fill: '#3B82F6', strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                <HiTrendingUp size={48} className="opacity-20" />
                                <p className="text-xs uppercase tracking-[0.2em]">Belum ada data penjualan</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Operations Table */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
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

const StatCard = ({ label, value, unit, icon, color, grow }) => {
    const colors = {
        blue: "bg-blue-50 text-blue-600 hover:border-blue-200",
        emerald: "bg-emerald-50 text-emerald-600 hover:border-emerald-200",
        indigo: "bg-indigo-50 text-indigo-600 hover:border-indigo-200"
    };

    return (
        <div className={`relative bg-white p-7 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-all duration-300 overflow-hidden ${colors[color].split(' ').pop()}`}>
            <div className="relative z-10 space-y-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h4 className="text-3xl font-medium text-slate-900 tracking-tighter">{value}</h4>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">{unit}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest mt-2" style={{ color: `var(--color-${color}-600)` }}>
                    <div className={`w-1 h-1 rounded-full animate-pulse ${grow ? 'bg-current' : 'hidden'}`} />
                    <span className="opacity-70">{grow}</span>
                </div>
            </div>
            <div className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:bg-opacity-100 group-hover:text-white ${colors[color].split(' ').slice(0, 2).join(' ')} group-hover:${color === 'blue' ? 'bg-blue-600' : color === 'emerald' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                {icon}
            </div>
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 bg-${color}-50`} />
        </div>
    );
};

export default CreatorDashboard;
