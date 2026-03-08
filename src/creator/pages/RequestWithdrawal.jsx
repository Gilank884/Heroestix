import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import useAuthStore from '../../auth/useAuthStore';
import {
    Wallet,
    Building2,
    CreditCard,
    ArrowLeft,
    CheckCircle2,
    Info,
    User,
    ShieldCheck
} from 'lucide-react';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

const formatThousand = (val) => {
    if (!val) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function RequestWithdrawal() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [balance, setBalance] = useState(0);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [creatorInfo, setCreatorInfo] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);

    useEffect(() => {
        if (user?.id) {
            fetchData();
        }
    }, [user?.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Creator Info
            const { data: creatorData } = await supabase
                .from('creators')
                .select('*')
                .eq('id', user.id)
                .single();
            setCreatorInfo(creatorData);

            // 2. Fetch Financial Data
            const { data: eventsData } = await supabase.from('events').select('id').eq('creator_id', user.id);
            const eventIds = eventsData?.map(e => e.id) || [];

            let netSales = 0;
            let withdrawalData = [];

            if (eventIds.length > 0) {
                const [ticketsRes, withdrawalRes] = await Promise.all([
                    supabase
                        .from('tickets')
                        .select('id, orders!inner(id, total, status), ticket_types!inner(event_id)')
                        .in('ticket_types.event_id', eventIds)
                        .eq('orders.status', 'paid'),
                    supabase.from('withdrawals').select('*').eq('creator_id', user.id)
                ]);

                const ticketsWithOrders = ticketsRes.data || [];
                withdrawalData = withdrawalRes.data || [];

                if (ticketsWithOrders.length > 0) {
                    // Logic to handle orders with multiple tickets fairly
                    const orderIds = [...new Set(ticketsWithOrders.map(t => t.order_id))];
                    const { data: allTicketsInOrders } = await supabase
                        .from('tickets')
                        .select('order_id')
                        .in('order_id', orderIds);

                    const orderTicketCounts = {};
                    allTicketsInOrders?.forEach(t => {
                        orderTicketCounts[t.order_id] = (orderTicketCounts[t.order_id] || 0) + 1;
                    });

                    let calculatedNetSales = 0;
                    ticketsWithOrders.forEach(t => {
                        const countInOrder = orderTicketCounts[t.order_id] || 1;
                        const share = Number(t.orders.total) / countInOrder;
                        calculatedNetSales += (share - 8500);
                    });

                    netSales = calculatedNetSales;
                }
            } else {
                const { data } = await supabase.from('withdrawals').select('*').eq('creator_id', user.id);
                withdrawalData = data || [];
            }

            // Calculate Already Withdrawn (approved)
            const totalWithdrawn = withdrawalData
                .filter(curr => curr.status === 'approved')
                .reduce((acc, curr) => acc + Number(curr.amount), 0);

            setBalance(netSales - totalWithdrawn);
            setPendingRequests(withdrawalData.filter(r => r.status === 'pending'));

        } catch (error) {
            console.error('Error fetching data:', error.message);
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

        if (amount < 100000) {
            alert("Nominal minimal penarikan adalah Rp 100.000.");
            return;
        }

        if (pendingRequests.length > 0) {
            alert("Anda masih memiliki pengajuan yang sedang diproses.");
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('withdrawals')
                .insert({
                    creator_id: user.id,
                    amount: amount,
                    status: 'pending'
                });

            if (error) throw error;
            navigate('/withdrawals');
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Menyiapkan Penarikan...</span>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 pt-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/withdrawals')}
                    className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Ajukan Penarikan <span className="text-blue-600 italic">Saldo</span></h2>
                    <p className="text-slate-500 font-medium text-[10px]">Konfirmasi data rekening dan nominal pencairan.</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Main Form Section */}
                <form onSubmit={handleRequestWithdrawal} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 space-y-6">
                        {/* Balance Info */}
                        <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest leading-none">Saldo Tersedia</p>
                                <h3 className="text-2xl font-bold text-blue-900 tracking-tight">{rupiah(balance)}</h3>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md shadow-blue-500/5">
                                <Wallet size={24} className="text-blue-600" />
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Nominal Penarikan</label>
                                <button
                                    type="button"
                                    onClick={() => setWithdrawAmount(balance.toString())}
                                    className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                                >
                                    Tarik Semua
                                </button>
                            </div>
                            <div className="relative group/input">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-300 group-focus-within/input:text-blue-600 transition-colors text-lg">Rp</span>
                                <input
                                    required
                                    type="text"
                                    value={formatThousand(withdrawAmount)}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setWithdrawAmount(val);
                                    }}
                                    placeholder="0"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-2xl text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all tabular-nums"
                                />
                            </div>
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[9px] text-slate-400 font-medium italic">* Minimal penarikan Rp 100.000</p>
                                <p className="text-[9px] text-blue-600 font-bold italic">Maksimal 3 hari pengerjaan</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || balance < 100000}
                            className={`w-full py-4 rounded-2xl font-semibold uppercase tracking-[0.2em] text-xs shadow-lg transition-all active:scale-95 ${submitting || balance < 100000
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white shadow-blue-500/10 hover:bg-blue-700 hover:scale-[1.01]'
                                }`}
                        >
                            {submitting ? 'Mengirim Data...' : 'Konfirmasi & Kirim'}
                        </button>
                    </div>
                </form>

                {/* Info Sections Stacked */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* EO Details */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <User size={14} />
                            </div>
                            <h4 className="font-semibold text-slate-900 uppercase text-[9px] tracking-widest">Detail EO</h4>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Organisasi</p>
                                <p className="font-semibold text-slate-800 text-xs">{creatorInfo?.display_name || creatorInfo?.name}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Email</p>
                                <p className="font-medium text-slate-600 text-xs">{user?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bank Account */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Building2 size={14} />
                            </div>
                            <h4 className="font-semibold text-slate-900 uppercase text-[9px] tracking-widest">Bank Tujuan</h4>
                        </div>

                        {creatorInfo?.bank_account ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Bank</p>
                                        <p className="font-semibold text-slate-800 text-xs">{creatorInfo.bank_name}</p>
                                    </div>
                                    <div className="p-1 px-2.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center gap-1.5 scale-75 origin-right">
                                        <ShieldCheck size={12} />
                                        <span className="text-[8px] font-semibold uppercase">Verified</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">No. Rekening</p>
                                    <p className="font-semibold text-slate-800 tracking-wider text-xs">{creatorInfo.bank_account}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center">
                                <p className="text-[9px] font-bold text-red-800 uppercase tracking-widest">Bank Belum Diatur</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
