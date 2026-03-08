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
        totalEvents: 0
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

            if (eventIds.length > 0) {
                const { data: tData, error: tError } = await supabase
                    .from('tickets')
                    .select(`
                        id,
                        order_id,
                        orders!inner (id, total, status),
                        ticket_types!inner (event_id)
                    `)
                    .in('ticket_types.event_id', eventIds)
                    .eq('orders.status', 'paid');

                if (tError) throw tError;
                ticketsWithOrders = tData || [];
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
                    const share = Number(t.orders.total) / totalInOrder;
                    totalRevenue += (share - 8500);
                });

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

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-[3px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Memuat Overview...</span>
            </div>
        );
    }

    if (!isVerified) {
        return <VerificationPending />;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 py-2">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                <h2 className="text-2xl text-slate-900 tracking-tight">Statistik Data</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Event */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-1">Total Event</p>
                    <div className="flex items-baseline gap-2">
                        <h4 className="text-3xl text-slate-900 tracking-tighter">{stats.totalEvents}</h4>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">Events</span>
                    </div>
                </div>

                {/* Tiket Terjual */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-1">Tiket Terjual</p>
                    <div className="flex items-baseline gap-2">
                        <h4 className="text-3xl text-slate-900 tracking-tighter">{stats.ticketsSold}</h4>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">Tickets</span>
                    </div>
                </div>

                {/* Total Pendapatan */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-1">Pendapatan Bersih</p>
                    <div className="flex items-baseline gap-2">
                        <h4 className="text-2xl text-slate-900 tracking-tight">{rupiah(stats.totalRevenue)}</h4>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-blue-600 rounded-full" />
                        <h3 className="text-xl text-slate-900">Performa Per Event</h3>
                    </div>
                    <div className="relative group w-full md:w-80">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari event..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] text-slate-500 uppercase tracking-widest">Nama Event</th>
                                    <th className="px-8 py-5 text-[10px] text-slate-500 uppercase tracking-widest">Jumlah Tiket Terjual</th>
                                    <th className="px-8 py-5 text-[10px] text-slate-500 uppercase tracking-widest text center">Status Event</th>
                                    <th className="px-8 py-5 text-[10px] text-slate-500 uppercase tracking-widest text-right">Total Pendapatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredHistory.length > 0 ? filteredHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
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
                                                    <p className="text-slate-800 tracking-tight">{item.title}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">ID: {item.id.substring(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-slate-900 text-lg">{item.ticketsSold}</span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Tiket</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border ${item.status === 'Aktif'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-slate-50 text-slate-400 border-slate-100'
                                                }`}>
                                                {item.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <p className="text-slate-900 tabular-nums">{rupiah(item.totalRevenue)}</p>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-40">
                                                <Search size={32} className="text-slate-300" />
                                                <p className="text-slate-400 uppercase tracking-widest text-[10px]">Data event tidak ditemukan</p>
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
