import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import useAuthStore from '../../auth/useAuthStore';
import {
    BarChart3,
    TrendingUp,
    Ticket,
    ArrowDownLeft,
    Search,
    Calendar,
    ArrowLeft
} from 'lucide-react';
import VerificationPending from '../components/VerificationPending';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function EventSalesReport() {
    const { id: eventId } = useParams();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [eventData, setEventData] = useState(null);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        ticketsSold: 0,
        netRevenue: 0
    });
    const [isVerified, setIsVerified] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user?.id && eventId) {
            fetchEventSalesData();
        }
    }, [user?.id, eventId]);

    const fetchEventSalesData = async () => {
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

            // 1. Fetch Event Details
            const { data: event } = await supabase
                .from('events')
                .select('title')
                .eq('id', eventId)
                .single();
            setEventData(event);

            // 2. Fetch related ticket types for this event
            const { data: ticketTypes } = await supabase
                .from('ticket_types')
                .select('id')
                .eq('event_id', eventId);

            if (ttIds.length > 0) {
                // 3. Fetch Tickets with joined Orders for this event
                const { data: ticketsWithOrders, error: tError } = await supabase
                    .from('tickets')
                    .select(`
                        id,
                        created_at,
                        order_id,
                        orders!inner (id, total, status),
                        ticket_types!inner (event_id)
                    `)
                    .in('ticket_type_id', ttIds)
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
                    let calculatedNetRevenue = 0;
                    ticketsWithOrders.forEach(t => {
                        const totalTicketsInOrder = orderTicketCounts[t.order_id] || 1;
                        const shareOfGross = Number(t.orders.total) / totalTicketsInOrder;
                        calculatedNetRevenue += (shareOfGross - 8500);
                    });

                    setStats({
                        totalRevenue: calculatedNetRevenue,
                        ticketsSold: ticketsWithOrders.length
                    });
                    setHistory(ticketsWithOrders || []);
                }
            }
        } catch (error) {
            console.error('Error fetching event sales data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredHistory = history.filter(item =>
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && !eventData) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-[3px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memproses Laporan...</span>
            </div>
        );
    }

    if (!isVerified) return <VerificationPending />;

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
            {/* Minimalist Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Laporan Penjualan
                    </h2>
                    <p className="text-slate-500 font-medium">
                        Rincian performa keuangan untuk event <span className="text-slate-900 font-semibold">{eventData?.title}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Event Report</span>
                </div>
            </div>

            {/* Metric Cards - Minimalist Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
                    <div className="space-y-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Tiket Terjual</p>
                        <div className="flex items-baseline gap-2">
                            <h4 className="text-4xl font-bold text-slate-900 tracking-tight">{stats.ticketsSold}</h4>
                            <span className="text-sm font-semibold text-slate-400">Inventory</span>
                        </div>
                    </div>
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <Ticket size={28} strokeWidth={1.5} />
                    </div>
                </div>

                <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
                    <div className="space-y-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Total Pendapatan</p>
                        <h4 className="text-4xl font-bold text-slate-900 tracking-tight">{rupiah(stats.totalRevenue)}</h4>
                    </div>
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <TrendingUp size={28} strokeWidth={1.5} />
                    </div>
                </div>
            </div>

            {/* Transactions Section */}
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-blue-600 rounded-full" />
                        <h3 className="text-xl font-bold text-slate-900">Riwayat Penjualan</h3>
                    </div>
                    <div className="relative group w-full md:w-80">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari transaksi..."
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
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Keterangan</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tanggal</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredHistory.length > 0 ? filteredHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 text-slate-400 border border-slate-100 group-hover:bg-blue-100 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                                                    <ArrowDownLeft size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 tracking-tight">Order #{item.orders.id.substring(0, 8)}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Ticket ID: {item.id.substring(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-slate-500 text-xs font-semibold">{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="font-bold text-slate-900 tabular-nums">+{rupiah(Number(item.orders.total) - 8500)}</p>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-40">
                                                <Search size={32} className="text-slate-300" />
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Belum ada data penjualan</p>
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
