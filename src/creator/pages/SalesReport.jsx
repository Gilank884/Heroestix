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
    Calendar
} from 'lucide-react';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function SalesReport() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        ticketsSold: 0,
        netRevenue: 0
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
            const { data: balanceData, error } = await supabase
                .from('creator_balances')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const sales = balanceData.filter(item => item.type === 'credit');

            const totalRevenue = sales.reduce((acc, curr) => acc + Number(curr.amount), 0);
            const netRevenue = totalRevenue; // Platform fees are already deducted before credit to creator_balances in most systems, adjust if needed
            const ticketsSold = sales.length;

            setStats({
                totalRevenue,
                ticketsSold,
                netRevenue
            });
            setHistory(sales || []);

        } catch (error) {
            console.error('Error fetching sales data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredHistory = history.filter(item =>
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Menyusun Laporan...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Financial Insights</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                        Laporan <span className="text-blue-600 italic">Penjualan</span>
                    </h2>
                    <p className="text-slate-500 font-medium text-sm">Analisis detail pendapatan dan performa penjualan tiket Anda.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">Seluruh Waktu</span>
                    </div>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Revenue</p>
                        <h4 className="text-2xl font-black text-slate-900">{rupiah(stats.totalRevenue)}</h4>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Revenue</p>
                        <h4 className="text-2xl font-black text-slate-900">{rupiah(stats.netRevenue)}</h4>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600">
                        <Ticket size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiket Terjual</p>
                        <h4 className="text-2xl font-black text-slate-900">{stats.ticketsSold} <span className="text-sm text-slate-400 font-bold ml-1">Tiket</span></h4>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                        <h3 className="text-xl font-black text-slate-900">Rincian Transaksi</h3>
                    </div>
                    <div className="relative group min-w-[300px]">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari transaksi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden text-[13px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Detail Transaksi</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Tanggal</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Pendapatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-medium">
                                {filteredHistory.length > 0 ? filteredHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100">
                                                    <ArrowDownLeft size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 leading-tight mb-1">{item.description}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest underline decoration-dotted">Ref: {item.id.substring(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-slate-500 font-bold">{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <p className="font-black text-blue-600 text-base tabular-nums">+{rupiah(item.amount)}</p>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                <Search size={40} className="text-slate-300" />
                                                <p className="text-slate-400 font-bold uppercase tracking-[0.15em] text-xs">Tidak ditemukan data transaksi</p>
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
