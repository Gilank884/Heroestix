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
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user?.id && eventId) {
            fetchEventSalesData();
        }
    }, [user?.id, eventId]);

    const fetchEventSalesData = async () => {
        setLoading(true);
        try {
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

            const ttIds = (ticketTypes || []).map(tt => tt.id);

            if (ttIds.length > 0) {
                // 3. Fetch individual tickets belonging to these ticket types
                const { data: tickets } = await supabase
                    .from('tickets')
                    .select('id')
                    .in('ticket_type_id', ttIds);

                const tIds = (tickets || []).map(t => t.id);

                if (tIds.length > 0) {
                    // 4. Fetch creator_balances linked to these tickets
                    const { data: balanceData, error } = await supabase
                        .from('creator_balances')
                        .select('*')
                        .in('ticket_id', tIds)
                        .order('created_at', { ascending: false });

                    if (error) throw error;

                    const sales = (balanceData || []).filter(item => item.type === 'credit');
                    const totalRevenue = sales.reduce((acc, curr) => acc + Number(curr.amount), 0);

                    setStats({
                        totalRevenue,
                        ticketsSold: sales.length,
                        netRevenue: totalRevenue // Adjust if platform fee deduction happens at this level
                    });
                    setHistory(sales || []);
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
                <div className="w-12 h-12 border-[3px] border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Mengaudit Penjualan Event...</span>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Laporan Event</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Laporan Penjualan
                    </h2>
                    <p className="text-slate-500 text-sm">Rincian performa keuangan untuk event <span className="text-slate-900 font-semibold">{eventData?.title}</span></p>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pendapatan</p>
                        <h4 className="text-2xl font-bold text-slate-900">{rupiah(stats.totalRevenue)}</h4>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                        <BarChart3 size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pendapatan Bersih</p>
                        <h4 className="text-2xl font-bold text-slate-900">{rupiah(stats.netRevenue)}</h4>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                        <Ticket size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tiket Terjual</p>
                        <h4 className="text-2xl font-bold text-slate-900">{stats.ticketsSold} <span className="text-sm text-slate-400 font-medium ml-1">Tiket</span></h4>
                    </div>
                </div>
            </div>

            {/* Transactions */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-5 bg-indigo-600 rounded-full" />
                        <h3 className="text-lg font-bold text-slate-900">Riwayat Penjualan</h3>
                    </div>
                    <div className="relative min-w-[300px]">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari transaksi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keterangan</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredHistory.length > 0 ? filteredHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                    <ArrowDownLeft size={14} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm leading-tight">{item.description}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {item.ticket_id?.substring(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-500 text-sm font-medium">{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="font-bold text-indigo-600 tabular-nums">+{rupiah(item.amount)}</p>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-slate-400 font-medium text-sm">Belum ada data penjualan</td>
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
