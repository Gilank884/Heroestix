import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Wallet,
    ChevronRight,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    XCircle,
    MoreHorizontal,
    ArrowUpRight,
    Building2,
    Banknote,
    PieChart,
    ArrowRight,
    AlertCircle,
    Activity,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Cash = () => {
    const [requests, setRequests] = useState([]);
    const [creatorSettlements, setCreatorSettlements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [filter, setFilter] = useState('all');
    const [settlementSearch, setSettlementSearch] = useState('');

    // Financial Metrics
    const [metrics, setMetrics] = useState({
        totalGross: 0,
        totalNet: 0,
        disbursed: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch aggregated data from Edge Function to bypass client-side row limits
            const { data, error } = await supabase.functions.invoke('get-admin-financials');

            if (error) throw error;

            console.log("Admin Financials Data:", data);

            // Set Metrics
            setMetrics({
                totalGross: data.metrics.totalGross || 0,
                totalNet: data.metrics.totalNet || 0,
                disbursed: data.metrics.disbursed || 0
            });

            // Set Settlements
            setCreatorSettlements(data.settlements || []);

            // Set Requests (Withdrawals)
            // The Edge Function returns 'withdrawals' with 'creators' + 'profiles' joined
            setRequests(data.withdrawals || []);

        } catch (err) {
            console.error('CRITICAL: Error merging ledger data:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const { error: updateError } = await supabase
                .from('withdrawals')
                .update({ status: newStatus })
                .eq('id', id);

            if (updateError) throw updateError;
            fetchData();
            setSelectedRequest(null);
        } catch (err) {
            alert('Error updating status: ' + err.message);
        }
    };

    const rupiah = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const filteredRequests = requests.filter(req =>
        filter === 'all' ? true : req.status === filter
    );

    const filteredSettlements = creatorSettlements.filter(s =>
        s.brandName.toLowerCase().includes(settlementSearch.toLowerCase()) ||
        s.ownerName.toLowerCase().includes(settlementSearch.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Auditing Financial Records...</span>
        </div>
    );

    const statsConfig = [
        { label: 'Platform Gross Revenue', value: rupiah(metrics.totalGross), icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Total Payment' },
        { label: 'Creator Base Earnings', value: rupiah(metrics.totalNet), icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Pre-Tax' },
        { label: 'Disbursed to Creators', value: rupiah(metrics.disbursed), icon: PieChart, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: 'Settled' },
    ];

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Treasury Operations</span>
                    </div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 italic">Financial <span className="text-blue-600 not-italic">Ledger</span></h2>
                    <p className="text-slate-500 font-medium text-sm mt-2">Monitor gross revenue, creator earnings, and settlement history.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchData} className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all active:scale-95 shadow-sm">
                        Refresh Ledger
                    </button>
                </div>
            </div>

            {/* Error Display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-8 py-4 bg-red-50 border border-red-100 rounded-[1.5rem] flex items-center gap-3 text-red-600 text-xs font-bold shadow-sm"
                    >
                        <AlertCircle size={16} className="text-red-400" />
                        <span>System Sync Issue: {error}. Data integrity may be affected.</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Financial Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statsConfig.map((stat, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={stat.label}
                        className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm`}>
                                <stat.icon size={22} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 flex items-center gap-1 uppercase tracking-widest">
                                {stat.trend}
                            </span>
                        </div>
                        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</h3>
                        <p className="text-3xl font-bold text-slate-900 mt-1.5 tracking-tight tabular-nums">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Creator Settlement Registry */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                            <ShieldCheck size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Merchant Settlement Registry</h3>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 focus-within:bg-white focus-within:border-blue-400 focus-within:text-blue-500 transition-all w-full md:w-80 shadow-sm">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Find creator or owner..."
                            value={settlementSearch}
                            onChange={(e) => setSettlementSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium w-full placeholder:text-slate-400 text-slate-800"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant Entity</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Gross (W/ Pajak)</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Net (Basic Price)</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Owner Received</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredSettlements.map((s, idx) => (
                                <tr key={s.id} className="group hover:bg-slate-50/30 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 font-bold text-xs shadow-sm uppercase">
                                                {s.brandName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm uppercase tracking-tight">{s.brandName}</p>
                                                <p className="text-[10px] font-bold text-slate-400 italic">Owner: {s.ownerName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <p className="text-sm font-bold text-slate-900 tabular-nums">{rupiah(s.gross)}</p>
                                        <span className="text-[9px] font-black text-slate-300 uppercase mt-0.5 tracking-tighter">Post-Tax Payment</span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <p className="text-sm font-bold text-blue-600 tabular-nums">{rupiah(s.net)}</p>
                                        <span className="text-[9px] font-black text-blue-400/50 uppercase mt-0.5 italic">Creator Share</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex flex-col items-end">
                                            <p className="text-sm font-bold text-emerald-600 tabular-nums">{rupiah(s.disbursed)}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Settled</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Withdrawal History Section */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                            <Activity size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Active Disbursment Queue</h3>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100 w-fit">
                        {['all', 'pending', 'approved', 'rejected'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === f
                                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Info</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Volume</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredRequests.map((req, idx) => (
                                <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.02 }}
                                    key={req.id}
                                    className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedRequest(req)}
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 font-bold text-xs shadow-sm group-hover:border-blue-200 transition-all uppercase">
                                                {req.creators?.brand_name?.charAt(0) || 'C'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm uppercase tracking-tight group-hover:text-blue-600 transition-colors font-mono">{req.creators?.brand_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 italic">Owner: {req.creators?.profiles?.full_name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xs font-bold text-slate-700">{req.creators?.bank_name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest opacity-60">••••{req.creators?.bank_account_number?.slice(-4)}</p>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <p className="text-sm font-bold text-slate-900 tabular-nums">{rupiah(req.amount)}</p>
                                        <p className="text-[9px] font-black text-slate-300 uppercase mt-0.5">Disbursement Req</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-red-50 text-red-600 border-red-100'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-300 group-hover:text-blue-600">
                                            <ArrowRight size={18} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Side Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedRequest(null)}
                        className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-50 flex items-center justify-end p-4 lg:p-10"
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg h-full bg-white rounded-[3rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
                        >
                            <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-[1.5rem] flex items-center justify-center text-blue-600 font-bold text-2xl shadow-sm uppercase">
                                        {selectedRequest.creators?.brand_name?.charAt(0)}
                                    </div>
                                    <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${selectedRequest.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        selectedRequest.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            'bg-red-50 text-red-600 border-red-100'
                                        }`}>
                                        {selectedRequest.status} REQUEST
                                    </div>
                                </div>
                                <h3 className="text-3xl font-extrabold text-slate-900 italic tracking-tight uppercase leading-tight">{selectedRequest.creators?.brand_name}</h3>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Owner: <span className="text-blue-600">{selectedRequest.creators?.profiles?.full_name}</span></p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Capital Settlement</h4>
                                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Total Disbursement</p>
                                            <p className="text-4xl font-black tracking-tight tabular-nums mb-2">{rupiah(selectedRequest.amount)}</p>
                                            <div className="px-4 py-1.5 bg-white/5 rounded-full inline-flex items-center gap-2 border border-white/10">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Amount</span>
                                            </div>
                                        </div>
                                        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all duration-700" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Banking Destination</h4>
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                                            <Building2 size={22} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{selectedRequest.creators?.bank_name}</p>
                                            <p className="font-bold text-slate-900 text-lg tabular-nums tracking-widest">{selectedRequest.creators?.bank_account_number}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 italic opacity-60">REF: {selectedRequest.creators?.bank_account_name}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 border-t border-slate-50 bg-slate-50/10 flex gap-4">
                                {selectedRequest.status === 'pending' ? (
                                    <>
                                        <button
                                            onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                                            className="flex-1 py-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                                        >
                                            Confirm Payment
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                                            className="px-8 py-4 bg-white text-red-600 border border-red-100 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-red-50 transition-all"
                                        >
                                            Reject
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        disabled
                                        className="flex-1 py-4 bg-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-slate-200 cursor-not-allowed"
                                    >
                                        Settlement {selectedRequest.status.toUpperCase()}
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    className="px-6 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-slate-900 hover:border-slate-300 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Cash;
