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
    Sparkles
} from 'lucide-react';

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
        totalRevenue: 0,
        ticketsSold: 0,
        totalEvents: 0
    });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user?.id) {
            fetchSalesData();
        }
    }, [user?.id]);

    const fetchSalesData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all events for this creator
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false });

            if (eventsError) throw eventsError;

            // 2. Fetch all sales credits for this creator
            const { data: balanceData, error: balanceError } = await supabase
                .from('creator_balances')
                .select('*')
                .eq('creator_id', user.id)
                .eq('type', 'credit');

            if (balanceError) throw balanceError;

            // 3. To map balances to events, we need the tickets
            const ticketIds = balanceData.map(b => b.ticket_id).filter(Boolean);
            let ticketToEventMap = {};

            if (ticketIds.length > 0) {
                const { data: tData, error: tError } = await supabase
                    .from('tickets')
                    .select('id, ticket_types(event_id)')
                    .in('id', ticketIds);

                if (!tError && tData) {
                    tData.forEach(t => {
                        ticketToEventMap[t.id] = t.ticket_types?.event_id;
                    });
                }
            }

            // 4. Aggregating stats per event
            const eventStats = eventsData.map(event => {
                const eventBalances = balanceData.filter(b => ticketToEventMap[b.ticket_id] === event.id);
                const ticketsSold = eventBalances.length;
                const totalRevenue = eventBalances.reduce((acc, curr) => acc + (Number(curr.amount) - 8500), 0);

                // Determine status (Active if status is active and date is >= today)
                const today = new Date().toISOString().split('T')[0];
                const isActive = event.status === 'active' && event.event_date >= today;

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
            const totalRevenueAll = balanceData.reduce((acc, curr) => acc + (Number(curr.amount) - 8500), 0);
            const totalTicketsAll = balanceData.length;

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

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-[3px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat Overview...</span>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Header Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-12 text-white shadow-2xl shadow-blue-900/10 border border-white/5">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                            <Sparkles size={12} className="text-blue-300" />
                            <span className="text-[10px] uppercase tracking-[0.2em] text-blue-100">Creator Performance</span>
                        </div>
                        <div>
                            <h2 className="text-4xl md:text-5xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-blue-200 tracking-tight">
                                Overview Performa
                            </h2>
                            <p className="text-slate-300 font-medium max-w-lg mt-3 text-lg leading-relaxed">
                                Kelola insights, pantau penjualan tiket, dan lihat perkembangan pendapatan Anda dalam satu dashboard terintegrasi.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-6 py-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col items-center gap-1 group hover:bg-white/10 transition-colors">
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Active Status</span>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-sm font-medium text-white tracking-wide">Live Dashboard</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -ml-20 -mb-20" />
            </div>

            {/* Metric Cards - Premium Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Total Event */}
                <div className="relative bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    <div className="relative z-10 space-y-2">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Total Event Terdaftar</p>
                        <div className="flex items-baseline gap-2">
                            <h4 className="text-3xl font-medium text-slate-900 tracking-tighter">{stats.totalEvents}</h4>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Projects</span>
                        </div>
                    </div>
                    <div className="relative z-10 w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                        <Sparkles size={28} strokeWidth={1.5} />
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                </div>

                {/* Tiket Terjual */}
                <div className="relative bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    <div className="relative z-10 space-y-2">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Total Tiket Terjual</p>
                        <div className="flex items-baseline gap-2">
                            <h4 className="text-3xl font-medium text-slate-900 tracking-tighter">{stats.ticketsSold}</h4>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Units Sold</span>
                        </div>
                    </div>
                    <div className="relative z-10 w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                        <Ticket size={28} strokeWidth={1.5} />
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                </div>

                {/* Total Pendapatan */}
                <div className="relative bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    <div className="relative z-10 space-y-2">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Total Pendapatan Bersih</p>
                        <h4 className="text-2xl font-medium text-slate-900 tracking-tight">{rupiah(stats.totalRevenue)}</h4>
                    </div>
                    <div className="relative z-10 w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                        <TrendingUp size={28} strokeWidth={1.5} />
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                </div>
            </div>

            {/* List Section */}
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-blue-600 rounded-full" />
                        <h3 className="text-xl font-medium text-slate-900">Performa Per Event</h3>
                    </div>
                    <div className="relative group w-full md:w-80">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari event..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-medium text-slate-500 uppercase tracking-widest">Nama Event</th>
                                    <th className="px-8 py-5 text-[10px] font-medium text-slate-500 uppercase tracking-widest">Jumlah Tiket Terjual</th>
                                    <th className="px-8 py-5 text-[10px] font-medium text-slate-500 uppercase tracking-widest text center">Status Event</th>
                                    <th className="px-8 py-5 text-[10px] font-medium text-slate-500 uppercase tracking-widest text-right">Total Pendapatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredHistory.length > 0 ? filteredHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                                                    {item.banner ? (
                                                        <img
                                                            src={item.banner}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                            <Calendar size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800 tracking-tight">{item.title}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">ID: {item.id.substring(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="font-medium text-slate-900 text-lg">{item.ticketsSold}</span>
                                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Tiket</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest border ${item.status === 'Aktif'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-slate-50 text-slate-400 border-slate-100'
                                                }`}>
                                                {item.status}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="font-medium text-slate-900 tabular-nums">{rupiah(item.totalRevenue)}</p>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-40">
                                                <Search size={32} className="text-slate-300" />
                                                <p className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">Data event tidak ditemukan</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
