import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Activity,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Filter,
    Calendar,
    RefreshCw,
    Wallet,
    TrendingUp,
    ShoppingBag,
    XCircle,
    BarChart3,
    PieChart,
    LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function Transactions() {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [metrics, setMetrics] = useState({ totalBalance: 0, totalSales: 0, totalWithdrawals: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, sale, withdrawal
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    });
    const [viewMode, setViewMode] = useState('table'); // table, chart
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawNote, setWithdrawNote] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // Fetch Transactions
            const { data: txData, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false });

            if (txError) throw txError;

            // Fetch Orders and Profiles for joining
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('id, profiles(full_name, email)');

            if (orderError) console.warn("Could not fetch orders for join:", orderError);

            // In-memory Join
            const joinedTxs = (txData || []).map(tx => ({
                ...tx,
                orders: (orderData || []).find(o => o.id === tx.order_id)
            }));

            console.log("DEBUG: Joined Transactions:", joinedTxs);
            
            const txs = joinedTxs;
            
            // Calculate Metrics
            let totalSales = 0;
            let totalWithdrawals = 0;
            
            txs.forEach(tx => {
                const amt = Number(tx.amount || 0);
                if (amt > 0) totalSales += amt;
                else totalWithdrawals += Math.abs(amt);
            });

            setTransactions(txs);
            setMetrics({
                totalBalance: totalSales - totalWithdrawals,
                totalSales,
                totalWithdrawals
            });
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleManualWithdraw = async () => {
        if (!withdrawAmount || Number(withdrawAmount) <= 0) {
            alert("Jumlah penarikan tidak valid");
            return;
        }

        if (Number(withdrawAmount) > metrics.totalBalance) {
            alert("Saldo tidak mencukupi");
            return;
        }

        setIsWithdrawing(true);
        try {
            const { error } = await supabase.from('transactions').insert({
                amount: -Number(withdrawAmount),
                status: 'success',
                method: 'MANUAL_WITHDRAWAL',
                payment_provider_data: {
                    type: 'platform_manual_withdrawal',
                    note: withdrawNote,
                    timestamp: new Date().toISOString()
                }
            });

            if (error) throw error;

            alert("Penarikan berhasil dicatat!");
            setIsWithdrawModalOpen(false);
            setWithdrawAmount('');
            setWithdrawNote('');
            fetchTransactions();
        } catch (error) {
            console.error('Error recording withdrawal:', error);
            alert("Gagal mencatat penarikan: " + error.message);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        const s = searchQuery.toLowerCase();
        
        // Date Filtering
        const txDate = new Date(tx.created_at);
        const matchesDate = (!startDate || txDate >= new Date(startDate)) && 
                          (!endDate || txDate <= new Date(endDate + 'T23:59:59'));

        const matchesSearch = 
            (tx.id?.toLowerCase() || '').includes(s) ||
            (tx.orders?.profiles?.full_name?.toLowerCase() || '').includes(s) ||
            (tx.method?.toLowerCase() || '').includes(s);
        
        const isSale = Number(tx.amount || 0) > 0;
        let typeMatch = true;
        if (filterType === 'sale') typeMatch = isSale;
        else if (filterType === 'withdrawal') typeMatch = !isSale;
        
        return matchesSearch && matchesDate && typeMatch;
    });

    const getChartData = () => {
        const groups = {};
        
        // 1. Pre-fill all dates in range with 0
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            let curr = new Date(start);
            while (curr <= end) {
                const label = curr.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                groups[label] = { name: label, inflow: 0, outflow: 0, rawDate: new Date(curr) };
                curr.setDate(curr.getDate() + 1);
            }
        }

        // 2. Fill with actual data
        filteredTransactions.forEach(tx => {
            const d = new Date(tx.created_at);
            const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            
            if (!groups[label]) {
                groups[label] = { name: label, inflow: 0, outflow: 0, rawDate: d };
            }
            
            const amt = Number(tx.amount || 0);
            if (amt > 0) groups[label].inflow += amt;
            else groups[label].outflow += Math.abs(amt);
        });

        return Object.values(groups).sort((a, b) => a.rawDate - b.rawDate);
    };

    const chartData = getChartData();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing Ledger...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <img src="/Logo/Logo.png" alt="Heroestix" className="h-8 w-auto" />
                            <div className="w-1 h-6 bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Audit Trail</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-medium tracking-tight text-slate-900 italic">Platform <span className="text-blue-600 not-italic">Ledger</span></h1>
                        <p className="text-slate-500 font-medium text-sm mt-2">Comprehensive record of all financial movements.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 p-1 rounded-2xl mr-2">
                             <button 
                                onClick={() => setViewMode('table')}
                                title="Table View"
                                className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                             >
                                <LayoutDashboard size={18} />
                             </button>
                             <button 
                                onClick={() => setViewMode('chart')}
                                title="Chart View"
                                className={`p-2 rounded-xl transition-all ${viewMode === 'chart' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                             >
                                <BarChart3 size={18} />
                             </button>
                        </div>
                        <button
                            onClick={() => setIsWithdrawModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold text-white transition-all active:scale-95 shadow-lg shadow-rose-200"
                        >
                            <ArrowUpRight size={14} />
                            Tarik Saldo
                        </button>
                        <button
                            onClick={fetchTransactions}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all active:scale-95 shadow-sm"
                        >
                            <RefreshCw size={14} />
                            Sync Ledger
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[32px] border border-blue-100 shadow-sm shadow-blue-500/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-16 -mt-16" />
                    <div className="relative z-10 space-y-4">
                        <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em]">Net Platform Balance</p>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{rupiah(metrics.totalBalance)}</h3>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Inflow (Sales)</p>
                        <h3 className="text-2xl font-black text-slate-900 tabular-nums text-serif text-emerald-600">+{rupiah(metrics.totalSales)}</h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <ArrowDownLeft size={24} />
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Outflow (Payouts)</p>
                        <h3 className="text-2xl font-black text-slate-900 tabular-nums text-serif text-rose-600">-{rupiah(metrics.totalWithdrawals)}</h3>
                    </div>
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                        <ArrowUpRight size={24} />
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                            {['all', 'sale', 'withdrawal'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        filterType === type 
                                            ? 'bg-white text-blue-600 shadow-sm' 
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                            <Calendar size={14} className="text-slate-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent border-none outline-none text-[10px] font-bold text-slate-600 uppercase tracking-tight w-28"
                            />
                            <span className="text-slate-300 text-xs">→</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent border-none outline-none text-[10px] font-bold text-slate-600 uppercase tracking-tight w-28"
                            />
                            {(startDate || endDate) && (
                                <button 
                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                    className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                                >
                                    <XCircle size={14} className="text-slate-400" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/5 transition-all w-full md:w-80">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search by ID, Customer, Method..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-bold w-full placeholder:text-slate-300 text-slate-700"
                        />
                    </div>
                </div>

                {viewMode === 'table' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <th className="p-6 pl-8">Transaction</th>
                                    <th className="p-6">Entity / Description</th>
                                    <th className="p-6">Method</th>
                                    <th className="p-6 text-right">Amount</th>
                                    <th className="p-6 text-right">Running Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((tx, idx) => {
                                        const isSale = Number(tx.amount || 0) > 0;
                                        return (
                                            <tr key={tx.id} className="hover:bg-slate-50/50 transition-all group">
                                                <td className="p-6 pl-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2.5 rounded-xl ${isSale ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                            {isSale ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">#{tx.id.slice(0, 8).toUpperCase()}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">{new Date(tx.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <p className="text-sm font-bold text-slate-700">
                                                        {tx.orders?.profiles?.full_name || tx.payment_provider_data?.creator_name || tx.payment_provider_data?.note || 'System Payout'}
                                                    </p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        {isSale ? 'Ticket Sale' : (tx.method === 'MANUAL_WITHDRAWAL' ? 'Manual Withdrawal' : 'Withdrawal Payout')}
                                                    </p>
                                                </td>
                                                <td className="p-6">
                                                    <span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                                                        {tx.method || 'OTHER'}
                                                    </span>
                                                </td>
                                                <td className={`p-6 text-right font-black text-sm tabular-nums ${isSale ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {isSale ? '+' : '-'}{rupiah(Math.abs(tx.amount))}
                                                </td>
                                                <td className="p-6 text-right font-bold text-slate-400 text-xs tabular-nums">
                                                    {/* Simplified running total for now */}
                                                    ---
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <Activity size={48} className="text-slate-200" />
                                                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">No Transactions Found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                                    </linearGradient>
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
                                    tickFormatter={(val) => `Rp ${val / 1000}k`}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                                    formatter={(value) => [rupiah(value), '']}
                                    labelStyle={{ fontWeight: 800, marginBottom: '4px', fontSize: '12px' }}
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    align="right" 
                                    iconType="circle"
                                    wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="inflow" 
                                    name="Pemasukan (Sale)" 
                                    stroke="#2563eb" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorInflow)" 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="outflow" 
                                    name="Pengeluaran (Out)" 
                                    stroke="#e11d48" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorOutflow)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Withdraw Modal */}
            <AnimatePresence>
                {isWithdrawModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Tarik Saldo Platform</h3>
                                    <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                                        <Wallet size={20} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Jumlah Penarikan</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                                            <input
                                                type="text"
                                                value={withdrawAmount ? new Intl.NumberFormat("id-ID").format(withdrawAmount) : ''}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setWithdrawAmount(val);
                                                }}
                                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-rose-500/5 transition-all outline-none"
                                                placeholder="0"
                                            />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 pl-1">Saldo Tersedia: {rupiah(metrics.totalBalance)}</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Catatan (Opsional)</label>
                                        <textarea
                                            value={withdrawNote}
                                            onChange={(e) => setWithdrawNote(e.target.value)}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-rose-500/5 transition-all outline-none min-h-[100px] resize-none"
                                            placeholder="Contoh: Penarikan profit operasional..."
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setIsWithdrawModalOpen(false)}
                                        className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleManualWithdraw}
                                        disabled={isWithdrawing}
                                        className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-rose-200 disabled:opacity-50"
                                    >
                                        {isWithdrawing ? 'Memproses...' : 'Konfirmasi Tarik'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
