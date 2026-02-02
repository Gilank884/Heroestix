import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import useAuthStore from '../../auth/useAuthStore';
import {
    Wallet,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    XCircle,
    PlusCircle,
    Building2,
    CreditCard,
    Info,
    AlertCircle
} from 'lucide-react';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function Withdrawals() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [requests, setRequests] = useState([]);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [creatorInfo, setCreatorInfo] = useState(null);

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
            const { data: balanceData, error: balanceError } = await supabase
                .from('creator_balances')
                .select('*')
                .eq('creator_id', user.id);

            if (balanceError) throw balanceError;

            const total = balanceData.reduce((acc, curr) => {
                return curr.type === 'credit' ? acc + Number(curr.amount) : acc - Number(curr.amount);
            }, 0);

            setBalance(total);

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

        if (amount < 10000) {
            alert("Nominal minimal penarikan adalah Rp 10.000.");
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

            setIsRequestModalOpen(false);
            setWithdrawAmount('');
            fetchFinancials();
        } catch (error) {
            alert("Error: " + error.message);
        }
    };

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Menghitung Saldo...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pemanfaatan Saldo</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                        Penarikan <span className="text-blue-600 italic">Saldo</span>
                    </h2>
                    <p className="text-slate-500 font-medium text-sm">Kelola dana Anda dan pantau status pencairan ke rekening bank.</p>
                </div>
                <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:scale-105 hover:bg-blue-700 transition-all active:scale-95 text-sm"
                >
                    <PlusCircle size={18} />
                    Ajukan Penarikan
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Balance Card */}
                <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-blue-600/30 transition-all duration-700" />

                    <div className="relative z-10 flex flex-col h-full justify-between gap-10">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/5">
                                <Wallet size={32} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Saldo Tersedia Untuk Dicairkan</p>
                                <h3 className="text-4xl md:text-5xl font-black tracking-tight tabular-nums">{rupiah(balance)}</h3>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-white/40">
                            <Info size={14} />
                            <p className="text-[10px] font-bold uppercase tracking-widest leading-none">Min. Penarikan Rp 10.000 • Dana cair dalam 1-3 hari kerja</p>
                        </div>
                    </div>
                </div>

                {/* Bank Info Card */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                            <Building2 size={18} />
                        </div>
                        <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Rekening Tujuan</h4>
                    </div>

                    {creatorInfo?.bank_account ? (
                        <div className="space-y-4">
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-colors">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Nama Bank</p>
                                <p className="font-bold text-slate-800">{creatorInfo.bank_name}</p>
                            </div>
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-colors">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Nomor Rekening</p>
                                <div className="flex items-center gap-2">
                                    <CreditCard size={14} className="text-slate-400" />
                                    <p className="font-black text-slate-800 tracking-wider">{creatorInfo.bank_account}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-amber-50 rounded-3xl border border-amber-100 text-center gap-3">
                            <AlertCircle size={32} className="text-amber-500" />
                            <p className="text-xs font-bold text-amber-800 leading-relaxed uppercase tracking-widest">Belum Ada Rekening Terdaftar</p>
                            <p className="text-[10px] text-amber-600 font-medium">Lengkapi data bank di menu Profil Anda untuk melakukan penarikan.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Request Table */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                    <h3 className="text-xl font-black text-slate-900">Histori Pengajuan</h3>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Referensi</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Tanggal</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Nominal</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {requests.length > 0 ? requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="text-xs font-black text-slate-700 tracking-wider">WD-{req.id.substring(0, 8).toUpperCase()}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-slate-500">{new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="font-black text-slate-900">{rupiah(req.amount)}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-end">
                                                <StatusBadge status={req.status} />
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-16 text-center">
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60 italic">Belum ada pengajuan penarikan dana</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Withdrawal Modal */}
            {isRequestModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRequestModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                            <h2 className="text-2xl font-black text-slate-900 italic">Tarik <span className="text-blue-600">Saldo</span></h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Nominal minimal Rp 10.000</p>
                        </div>

                        <form onSubmit={handleRequestWithdrawal} className="p-8 space-y-6">
                            <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 leading-none">Saldo Tersedia</p>
                                    <p className="font-black text-blue-900 text-lg">{rupiah(balance)}</p>
                                </div>
                                <Wallet size={24} className="text-blue-400" />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nominal Penarikan</label>
                                <div className="relative group/input">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300 group-focus-within/input:text-blue-600 transition-colors">Rp</span>
                                    <input
                                        required
                                        type="number"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-black text-xl text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all tabular-nums"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRequestModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 text-xs uppercase tracking-widest"
                                >
                                    Tarik Sekarang
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
        pending: { label: 'Diproses', icon: Clock, className: 'bg-amber-50 text-amber-600 border-amber-100' },
        approved: { label: 'Berhasil', icon: CheckCircle2, className: 'bg-green-50 text-green-600 border-green-100' },
        rejected: { label: 'Ditolak', icon: XCircle, className: 'bg-red-50 text-red-600 border-red-100' },
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit border ${config.className}`}>
            <Icon size={12} />
            {config.label}
        </div>
    );
}
