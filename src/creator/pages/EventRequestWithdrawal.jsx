import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import useAuthStore from '../../auth/useAuthStore';
import {
    Wallet,
    Building2,
    CreditCard,
    ArrowLeft,
    Info,
    User,
    ShieldCheck,
    Calendar
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

export default function EventRequestWithdrawal() {
    const { id: eventId } = useParams();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [balance, setBalance] = useState(0);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [creatorInfo, setCreatorInfo] = useState(null);
    const [eventData, setEventData] = useState(null);
    const [hasPending, setHasPending] = useState(false);

    useEffect(() => {
        if (user?.id && eventId) {
            fetchData();
        }
    }, [user?.id, eventId]);

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

            // 2. Fetch Event Details
            const { data: event } = await supabase
                .from('events')
                .select('title')
                .eq('id', eventId)
                .single();
            setEventData(event);

            // 3. Fetch Financials
            const { data: ticketTypes } = await supabase
                .from('ticket_types')
                .select('id')
                .eq('event_id', eventId);

            const ttIds = (ticketTypes || []).map(tt => tt.id);

            let tIds = [];
            if (ttIds.length > 0) {
                const { data: tickets } = await supabase
                    .from('tickets')
                    .select('id')
                    .in('ticket_type_id', ttIds);
                tIds = (tickets || []).map(t => t.id);
            }

            let salesTotal = 0;
            if (ttIds.length > 0) {
                // Fetch all tickets for this event that are PAID
                const { data: eventTickets, error: etError } = await supabase
                    .from('tickets')
                    .select(`
                        id,
                        order_id,
                        orders!inner (id, total, status)
                    `)
                    .in('ticket_type_id', ttIds)
                    .eq('orders.status', 'paid');

                if (etError) throw etError;

                if (eventTickets && eventTickets.length > 0) {
                    // Logic to handle orders with multiple tickets fairly
                    const orderIds = [...new Set(eventTickets.map(t => t.order_id))];
                    const { data: allTicketsInOrders } = await supabase
                        .from('tickets')
                        .select('order_id')
                        .in('order_id', orderIds);

                    const orderTicketCounts = {};
                    allTicketsInOrders?.forEach(t => {
                        orderTicketCounts[t.order_id] = (orderTicketCounts[t.order_id] || 0) + 1;
                    });

                    let calculatedSales = 0;
                    eventTickets.forEach(t => {
                        const countInOrder = orderTicketCounts[t.order_id] || 1;
                        const share = Number(t.orders.total) / countInOrder;
                        calculatedSales += (share - 8500);
                    });
                    salesTotal = calculatedSales;
                }
            }

            const { data: withdrawalData } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('creator_id', user.id);

            const eventWithdrawals = (withdrawalData || []).filter(w =>
                (w.description && w.description.includes(eventId)) || w.event_id === eventId
            );

            const withdrawnTotal = eventWithdrawals
                .filter(w => w.status === 'approved')
                .reduce((acc, curr) => acc + Number(curr.amount), 0);

            setBalance(salesTotal - withdrawnTotal);
            setHasPending(eventWithdrawals.some(w => w.status === 'pending'));

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
            alert("Saldo event tidak mencukupi.");
            return;
        }

        if (amount < 100000) {
            alert("Nominal minimal penarikan adalah Rp 100.000.");
            return;
        }

        if (hasPending) {
            alert("Anda masih memiliki pengajuan penarikan untuk event ini yang sedang diproses.");
            return;
        }

        setSubmitting(true);
        try {
            const description = `Penarikan Saldo Event: ${eventData?.title} (ID: ${eventId})`;

            const { error } = await supabase
                .from('withdrawals')
                .insert({
                    creator_id: user.id,
                    amount: amount,
                    status: 'pending',
                    description: description,
                    event_id: eventId
                });

            if (error) throw error;
            navigate(`/manage/event/${eventId}/withdrawals`);
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-[3px] border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Menghitung Saldo Event...</span>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 pt-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/manage/event/${eventId}/withdrawals`)}
                    className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tarik Saldo <span className="text-indigo-600 italic">Event</span></h2>
                    <p className="text-slate-500 font-medium text-[10px]">Pencairan dana khusus event <span className="text-slate-900 font-semibold">{eventData?.title}</span></p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Main Form Section */}
                <form onSubmit={handleRequestWithdrawal} className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="p-8 space-y-6">
                        {/* Balance Info */}
                        <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest leading-none">Saldo Event</p>
                                <h3 className="text-2xl font-bold text-indigo-900 tracking-tight">{rupiah(balance)}</h3>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/5">
                                <Wallet size={24} className="text-indigo-600" />
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Nominal Penarikan</label>
                                <button
                                    type="button"
                                    onClick={() => setWithdrawAmount(balance.toString())}
                                    className="text-[10px] font-semibold text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                                >
                                    Tarik Semua
                                </button>
                            </div>
                            <div className="relative group/input">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-300 group-focus-within/input:text-indigo-600 transition-colors text-lg">Rp</span>
                                <input
                                    required
                                    type="text"
                                    value={formatThousand(withdrawAmount)}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setWithdrawAmount(val);
                                    }}
                                    placeholder="0"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-2xl text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all tabular-nums"
                                />
                            </div>
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[9px] text-slate-400 font-medium italic">* Minimal penarikan Rp 100.000</p>
                                <p className="text-[9px] text-indigo-600 font-bold italic">Maksimal 3 hari pengerjaan</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || balance < 10000 || hasPending}
                            className={`w-full py-4 rounded-2xl font-semibold uppercase tracking-[0.2em] text-xs shadow-lg transition-all active:scale-95 ${submitting || balance < 10000 || hasPending
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white shadow-indigo-500/10 hover:bg-indigo-700 hover:scale-[1.01]'
                                }`}
                        >
                            {submitting ? 'Mengirim Data...' : (hasPending ? 'Ada Progres Pending' : 'Konfirmasi & Kirim')}
                        </button>
                    </div>
                </form>

                {/* Info Sections Stacked */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* EO Details */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
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
                                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Event</p>
                                <p className="font-medium text-slate-700 text-[10px] line-clamp-1">{eventData?.title}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bank Account */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
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
