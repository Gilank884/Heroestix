import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import useAuthStore from '../../auth/useAuthStore';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    CheckCircle2,
    XCircle,
    PlusCircle,
    Building2,
    CreditCard,
    Info
} from 'lucide-react';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function CreatorCash() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalWithdrawn, setTotalWithdrawn] = useState(0);
    const [history, setHistory] = useState([]);
    const [requests, setRequests] = useState([]);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [creatorInfo, setCreatorInfo] = useState(null);
    const [isVerified, setIsVerified] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchFinancials();
            fetchCreatorInfo();
        }
    }, [user?.id]);

    const fetchCreatorInfo = async () => {
        const { data } = await supabase
            .from('creators')
            .select('*')
            .eq('id', user.id)
            .single();
        setCreatorInfo(data);
    };

    const fetchFinancials = async () => {
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

            // 1. Fetch History (Recent transactions from creator_balances)
            const { data: historyData, error: historyError } = await supabase
                .from('creator_balances')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10); // Limit for display, edge function handles totals

            if (historyError) throw historyError;
            setHistory(historyData || []);

            // 2. Fetch Global Financials via Edge Function
            const { data: financialData, error: financialError } = await supabase.functions.invoke('get-creator-financials');

            if (financialError) {
                console.warn('Edge Function failed, using fallback calculation:', financialError);

                // Fallback: Replicate the new orders-based calculation
                const { data: eventsData } = await supabase.from('events').select('id').eq('creator_id', user.id);
                const eventIds = eventsData?.map(e => e.id) || [];

                let calculatedIncome = 0;
                if (eventIds.length > 0) {
                    const { data: ticketsWithOrders } = await supabase
                        .from('tickets')
                        .select('id, orders!inner(id, total, status), ticket_types!inner(event_id)')
                        .in('ticket_types.event_id', eventIds)
                        .eq('orders.status', 'paid');

                    if (ticketsWithOrders && ticketsWithOrders.length > 0) {
                        const orderIds = [...new Set(ticketsWithOrders.map(t => t.orders.id))];
                        const { data: allTicketsInOrders } = await supabase
                            .from('tickets')
                            .select('order_id')
                            .in('order_id', orderIds);

                        const orderTicketCounts = {};
                        allTicketsInOrders?.forEach(t => {
                            orderTicketCounts[t.order_id] = (orderTicketCounts[t.order_id] || 0) + 1;
                        });

                        let fallbackIncome = 0;
                        ticketsWithOrders.forEach(t => {
                            const countInOrder = orderTicketCounts[t.orders.id] || 1;
                            const share = Number(t.orders.total) / countInOrder;
                            fallbackIncome += (share - 8500);
                        });
                        calculatedIncome = fallbackIncome;
                    }
                }

                // Fetch total debits for fallback
                const { data: debitsData } = await supabase
                    .from('creator_balances')
                    .select('amount')
                    .eq('creator_id', user.id)
                    .eq('type', 'debit');

                const calculatedDebits = (debitsData || []).reduce((a, b) => a + Number(b.amount), 0);

                setTotalIncome(calculatedIncome);
                setTotalWithdrawn(calculatedDebits);
                setBalance(calculatedIncome - calculatedDebits);
            } else {
                setBalance(financialData.balance || 0);
                setTotalIncome(financialData.total_income || 0);
                setTotalWithdrawn(financialData.total_withdrawn || 0);
            }

            // 2. Fetch Withdrawal Requests
            const { data: requestData, error: requestError } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false });

            if (requestError) throw requestError;
            setRequests(requestData || []);

        } catch (error) {
            console.error('Error fetching financials:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestWithdrawal = async (e) => {
        e.preventDefault();
        const amount = Number(withdrawAmount);

        if (amount > balance) {
            alert("Saldo tidak mencukupi.");
            return;
        }

        if (amount <= 0) {
            alert("Nominal tidak valid.");
            return;
        }

        const hasPending = requests.some(r => r.status === 'pending');
        if (hasPending) {
            alert("Anda masih memiliki pengajuan yang sedang diproses.");
            return;
        }

        try {
            const { error } = await supabase
                .from('withdrawals')
                .insert({
                    creator_id: user.id,
                    amount: amount,
                    status: 'pending'
                });

            if (error) throw error;

            alert("Pengajuan penarikan berhasil dikirim.");
            setIsRequestModalOpen(false);
            setWithdrawAmount('');
            fetchFinancials();
        } catch (error) {
            alert("Error: " + error.message);
        }
    };

    if (loading && !balance) {
        return <div className="p-20 text-center font-bold text-slate-400">Loading Financials...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                        Cash <span className="text-[#1b3bb6]">Management</span>
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Lacak pendapatan, histori transaksi, dan penarikan saldo.</p>
                </div>
                <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="bg-[#1b3bb6] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:scale-105 transition-all active:scale-95"
                >
                    <PlusCircle size={20} />
                    Tarik Saldo
                </button>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Balance Card */}
                <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-10 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-blue-600/30 transition-all duration-700" />

                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                                <Wallet size={28} />
                            </div>
                            <div>
                                <p className="text-white/60 font-black text-[10px] uppercase tracking-[0.2em]">Saldo Tersedia</p>
                                <h3 className="text-4xl md:text-5xl font-black tracking-tight mt-1">{rupiah(balance)}</h3>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6 pt-4 border-t border-white/10">
                            <div>
                                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Total Pendapatan</p>
                                <p className="text-xl font-bold">{rupiah(totalIncome)}</p>
                            </div>
                            <div>
                                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Total Ditarik</p>
                                <p className="text-xl font-bold">{rupiah(totalWithdrawn)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bank Info Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Building2 size={20} className="text-[#1b3bb6]" />
                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Rekening Tujuan</h4>
                    </div>

                    {creatorInfo?.bank_account ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Bank</p>
                                <p className="font-bold text-slate-800">{creatorInfo.bank_name || 'N/A'}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Nomor Rekening</p>
                                <p className="font-bold text-slate-800 flex items-center gap-2">
                                    <CreditCard size={16} className="text-slate-400" />
                                    {creatorInfo.bank_account}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 text-center space-y-3">
                            <Info size={24} className="text-orange-500 mx-auto" />
                            <p className="text-xs text-orange-700 font-bold leading-relaxed">
                                Belum ada rekening terdaftar. Harap lengkapi di profil Anda.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Withdrawal Requests */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                        <h3 className="text-xl font-black text-slate-900">Pengajuan Penarikan</h3>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {requests.length > 0 ? requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(req.created_at).toLocaleDateString()}</p>
                                                <p className="text-xs font-bold text-slate-600 mt-0.5">ID: {req.id.substring(0, 8)}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-black text-slate-900">{rupiah(req.amount)}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={req.status} />
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center text-slate-400 text-sm italic font-medium">Belum ada pengajuan penarikan</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-1.5 h-6 bg-[#1b3bb6] rounded-full" />
                        <h3 className="text-xl font-black text-slate-900">Histori Transaksi</h3>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaksi</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {history.length > 0 ? history.slice(0, 10).map((h) => (
                                        <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${h.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                        {h.type === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 leading-tight">{h.description}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{new Date(h.created_at).toLocaleDateString()} • {h.type === 'credit' ? 'Incoming' : 'Withdrawal'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-black ${h.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                {h.type === 'credit' ? '+' : '-'}{rupiah(h.amount)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="2" className="px-6 py-12 text-center text-slate-400 text-sm italic font-medium">Belum ada histori transaksi</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Withdrawal Modal */}
            {isRequestModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRequestModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                            <h2 className="text-2xl font-black text-slate-900">Tarik <span className="text-[#1b3bb6]">Saldo</span></h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Nominal minimal Rp 10.000</p>
                        </div>

                        <form onSubmit={handleRequestWithdrawal} className="p-6 space-y-6">
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-800">Saldo Tersedia:</span>
                                <span className="font-black text-blue-900">{rupiah(balance)}</span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nominal Penarikan</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">Rp</span>
                                    <input
                                        required
                                        type="number"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-5 font-black text-slate-900 outline-none focus:border-[#1b3bb6] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRequestModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-[#1b3bb6] text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-[#16319c] transition-all"
                                >
                                    Ajukan Sekarang
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }) {
    const configs = {
        pending: { label: 'Pending', icon: Clock, className: 'bg-slate-100 text-slate-600' },
        approved: { label: 'Approved', icon: CheckCircle2, className: 'bg-green-50 text-green-600' },
        rejected: { label: 'Rejected', icon: XCircle, className: 'bg-red-50 text-red-600' },
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit ${config.className}`}>
            <Icon size={12} />
            {config.label}
        </div>
    );
}
