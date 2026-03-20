import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    ArrowLeft,
    Wallet,
    Building2,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    ShieldCheck,
    ArrowUpRight,
    Info,
    Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { exportToPDF } from '../../utils/pdfExport';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function WithdrawalDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState(null);
    const [creatorStats, setCreatorStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [actionType, setActionType] = useState('approve');
    const [actionAmount, setActionAmount] = useState(0);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (id) {
            fetchWithdrawalDetail();
        }
    }, [id]);

    const fetchWithdrawalDetail = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('withdrawals')
                .select(`
                    *,
                    creators:creator_id (
                        brand_name,
                        bank_name,
                        bank_account,
                        account_bank_name,
                        profiles (
                            full_name,
                            email
                        )
                    ),
                    events:event_id (
                        title
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setRequest(data);
            setActionAmount(data.amount);
            fetchCreatorStats(data.creator_id);
        } catch (error) {
            console.error('Error fetching withdrawal detail:', error.message);
            alert('Error fetching details: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCreatorStats = async (creatorId) => {
        setStatsLoading(true);
        try {
            const [ticketsRes, withdrawalRes] = await Promise.all([
                supabase
                    .from('tickets')
                    .select('id, order_id, orders!inner(id, total, status), ticket_types!inner(events!inner(creator_id))')
                    .eq('orders.status', 'paid')
                    .eq('ticket_types.events.creator_id', creatorId),
                supabase.from('withdrawals').select('*').eq('creator_id', creatorId)
            ]);

            const paidTickets = ticketsRes.data || [];
            const withdrawalData = withdrawalRes.data || [];

            let netSales = 0;
            if (paidTickets.length > 0) {
                const orderIds = [...new Set(paidTickets.map(t => t.order_id))];
                const { data: countData } = await supabase
                    .from('tickets')
                    .select('order_id')
                    .in('order_id', orderIds);

                const orderTicketCounts = {};
                countData?.forEach(t => {
                    orderTicketCounts[t.order_id] = (orderTicketCounts[t.order_id] || 0) + 1;
                });

                paidTickets.forEach(t => {
                    const countInOrder = orderTicketCounts[t.order_id] || 1;
                    const share = Number(t.orders.total) / countInOrder;
                    netSales += (share - 8500);
                });
            }

            const totalWithdrawn = withdrawalData
                .filter(curr => curr.status === 'approved')
                .reduce((acc, curr) => acc + Number(curr.amount), 0);

            setCreatorStats({
                netSales,
                totalWithdrawn,
                balance: netSales - totalWithdrawn
            });
        } catch (error) {
            console.error('Error fetching creator stats:', error);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleProcess = async () => {
        if (!request) return;
        setProcessing(true);

        try {
            const updates = {
                status: actionType === 'approve' ? 'approved' : 'rejected',
                updated_at: new Date().toISOString()
            };

            if (actionType === 'approve') {
                updates.amount = actionAmount;
            }

            const { error } = await supabase
                .from('withdrawals')
                .update(updates)
                .eq('id', request.id);

            if (error) throw error;

            alert('Withdrawal processed successfully!');
            navigate('/withdrawals');
        } catch (error) {
            alert('Error processing withdrawal: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleExport = async () => {
        const filename = `WD-${request.id.substring(0, 8).toUpperCase()}-Receipt.pdf`;
        await exportToPDF('withdrawal-receipt', filename);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!request) {
        return (
            <div className="p-10 text-center">
                <p className="text-slate-500 font-medium">Withdrawal request not found.</p>
                <button
                    onClick={() => navigate('/withdrawals')}
                    className="mt-4 text-blue-600 font-bold hover:underline"
                >
                    Back to List
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 pt-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/withdrawals')}
                    className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Withdrawal Detail</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: #{request.id.substring(0, 8)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Confirmation Card */}
                <div className="lg:col-span-12">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                        {/* Status Bar */}
                        <div className={`px-8 py-4 flex items-center justify-between ${request.status === 'pending' ? 'bg-amber-50 border-b border-amber-100' :
                                request.status === 'approved' ? 'bg-blue-50 border-b border-blue-100' : 'bg-red-50 border-b border-red-100'
                            }`}>
                            <div className="flex items-center gap-2">
                                <Clock size={16} className={request.status === 'pending' ? 'text-amber-600' : request.status === 'approved' ? 'text-blue-600' : 'text-red-600'} />
                                <span className={`text-xs font-black uppercase tracking-widest ${request.status === 'pending' ? 'text-amber-700' :
                                        request.status === 'approved' ? 'text-blue-700' : 'text-red-700'
                                    }`}>
                                    Status: {request.status === 'approved' ? 'Paid / Done' : request.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 capitalize">Requested on {new Date(request.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>

                        <div className="p-5 lg:p-8 space-y-6">
                            {/* Redesigned Confirmation Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Konfirmasi Transaksi</h2>
                                    </div>
                                    <button 
                                        onClick={handleExport}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-sm active:scale-95"
                                    >
                                        <Download size={14} />
                                        Download PDF
                                    </button>
                                </div>

                                <div id="withdrawal-receipt" className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                    {/* Sender (PT Peristiwa Kreatif Nusantara) */}
                                    <div className="md:col-span-5 bg-blue-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-blue-600/20">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                                        <div className="relative z-10 space-y-4">
                                            <div className="flex items-center gap-2 opacity-60">
                                                <Building2 size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Pengirim (Platform)</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mb-1 leading-none">Nama Bank</p>
                                                    <p className="font-bold text-white text-sm">Bank BNI</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mb-1 leading-none">No. Rekening</p>
                                                    <p className="font-mono font-black text-white text-base tracking-wider">1905373456</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-bold text-blue-200 uppercase tracking-widest leading-none mb-1">Atas Nama</p>
                                                    <p className="font-bold text-white text-xs truncate">PT Peristiwa Kreatif Nusantara</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrow icon */}
                                    <div className="md:col-span-2 flex justify-center">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 rotate-90 md:rotate-0">
                                            <ArrowUpRight size={24} className="rotate-45" />
                                        </div>
                                    </div>

                                    {/* Receiver (Creator) */}
                                    <div className="md:col-span-5 bg-white border-2 border-blue-600/20 rounded-3xl p-6 shadow-sm">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-blue-600/60">
                                                <User size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Penerima (Creator)</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Nama Bank</p>
                                                    <p className="font-bold text-slate-900 text-sm">{request.creators?.bank_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">No. Rekening</p>
                                                    <p className="font-mono font-black text-slate-900 text-base tracking-wider">{request.creators?.bank_account}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Atas Nama</p>
                                                    <p className="font-bold text-slate-900 text-xs truncate">{request.creators?.account_bank_name || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2">
                                    <Info size={14} className="text-blue-600" />
                                    <p className="text-[11px] font-bold text-blue-800 italic">"Apakah benar Konfirmasi Transaksi ini Sudah Di transfer?"</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Creator Info */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <User size={12} />
                                        Creator Information
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3">
                                        <div>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Name / Organization</p>
                                            <p className="font-bold text-slate-900 text-sm">{request.creators?.profiles?.full_name || request.creators?.brand_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Email Address</p>
                                            <p className="font-medium text-slate-600 text-xs">{request.creators?.profiles?.email}</p>
                                        </div>
                                        {request.events?.title && (
                                            <div>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Event Associated</p>
                                                <p className="font-bold text-blue-600 text-xs italic">{request.events.title}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Payout Info */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Building2 size={12} />
                                        Bank Payout Information
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-4">
                                        <div>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Destination Bank</p>
                                            <p className="font-bold text-slate-900 text-sm">{request.creators?.bank_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Account Number</p>
                                            <p className="font-mono font-bold text-slate-900 text-sm tracking-wider">{request.creators?.bank_account}</p>
                                        </div>
                                        <div className="pt-2">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                <ShieldCheck size={12} />
                                                Verified Bank
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Balance Stats */}
                            <div className="bg-slate-900 rounded-3xl p-6 text-white text-sm">
                                <h3 className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Financial Context</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Requested Amount</p>
                                        <p className="text-lg font-bold">{rupiah(request.amount)}</p>
                                    </div>
                                    {statsLoading ? (
                                        <div className="col-span-2 flex items-center gap-2 text-white/40 italic text-[10px] py-2">
                                            <div className="w-3 h-3 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                                            Recalculating...
                                        </div>
                                    ) : creatorStats ? (
                                        <>
                                            <div>
                                                <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Net Sales (All Time)</p>
                                                <p className="text-lg font-bold">{rupiah(creatorStats.netSales)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mb-1">Current Balance</p>
                                                <p className="text-lg font-bold text-blue-400">{rupiah(creatorStats.balance)}</p>
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </div>

                            {/* Action Form */}
                            {request.status === 'pending' && (
                                <div className="space-y-8 pt-6 border-t border-slate-100">
                                    <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
                                        <div className="flex-1 space-y-4 max-w-sm">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Action</label>
                                            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                                                <button
                                                    onClick={() => setActionType('approve')}
                                                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${actionType === 'approve'
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                                        : 'text-slate-500 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    Approve & Transfer
                                                </button>
                                                <button
                                                    onClick={() => setActionType('reject')}
                                                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${actionType === 'reject'
                                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                                        : 'text-slate-500 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    Reject Request
                                                </button>
                                            </div>
                                        </div>

                                        {actionType === 'approve' && (
                                            <div className="flex-1 space-y-4 max-w-sm">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Confirmed Amount (IDR)</label>
                                                <div className="relative group/input">
                                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-300 group-focus-within/input:text-blue-600 transition-colors text-lg">Rp</span>
                                                    <input
                                                        type="number"
                                                        value={actionAmount}
                                                        onChange={(e) => setActionAmount(e.target.value)}
                                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-xl text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleProcess}
                                        disabled={processing}
                                        className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.3em] text-sm shadow-2xl transition-all active:scale-95 ${actionType === 'approve'
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                                            : 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20'
                                            }`}
                                    >
                                        {processing ? 'Processing...' : (actionType === 'approve' ? 'Confirm Transfer & Mark Paid ✓' : 'Confirm Rejection')}
                                    </button>
                                </div>
                            )}

                            {/* Already Processed Message */}
                            {request.status !== 'pending' && (
                                <div className={`p-8 rounded-3xl border text-base font-bold flex items-center gap-4 ${request.status === 'approved'
                                        ? 'bg-blue-50 border-blue-100 text-blue-700'
                                        : 'bg-red-50 border-red-100 text-red-700'
                                    }`}>
                                    {request.status === 'approved' ? (
                                        <><CheckCircle2 size={24} /> Withdrawal ini telah berhasil ditransfer pada {new Date(request.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}. Jumlah: {rupiah(request.amount)}</>
                                    ) : (
                                        <><XCircle size={24} /> Withdrawal ini telah ditolak.</>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
