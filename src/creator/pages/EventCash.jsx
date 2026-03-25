import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
    Info,
    Calendar,
    ChevronRight,
    Search
} from 'lucide-react';
import VerificationPending from '../components/VerificationPending';
import { exportToPDF } from '../../utils/pdfExport';
import FormalReport from '../../components/Finance/FormalReport';
import { useRef } from 'react';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function EventCash() {
    const { id: eventId } = useParams();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [eventBalance, setEventBalance] = useState(0);
    const [totalSales, setTotalSales] = useState(0);
    const [totalWithdrawn, setTotalWithdrawn] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [creatorInfo, setCreatorInfo] = useState(null);
    const [eventData, setEventData] = useState(null);
    const [isVerified, setIsVerified] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const reportRef = useRef(null);

    useEffect(() => {
        if (user?.id && eventId) {
            fetchEventData();
            fetchFinancials();
            fetchCreatorInfo();
        }
    }, [user?.id, eventId]);

    const fetchEventData = async () => {
        const { data } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
        setEventData(data);
    };

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

            // 1. Fetch related ticket types for this event
            const { data: ticketTypes, error: ttError } = await supabase
                .from('ticket_types')
                .select('id')
                .eq('event_id', eventId);

            if (ttError) throw ttError;
            const ttIds = (ticketTypes || []).map(tt => tt.id);

            let tIds = [];
            if (ttIds.length > 0) {
                // 2. Fetch individual tickets belonging to these ticket types
                const { data: tickets, error: ticketsError } = await supabase
                    .from('tickets')
                    .select('id')
                    .in('ticket_type_id', ttIds);

                if (ticketsError) throw ticketsError;
                tIds = (tickets || []).map(t => t.id);
            }

            // 3. Fetch Tickets with joined Orders for this event
            let sales = 0;
            let ticketsForLedger = [];
            if (ttIds.length > 0) {
                // Fetch Event Tax
                const { data: eventTax } = await supabase
                    .from('event_taxes')
                    .select('*')
                    .eq('event_id', eventId)
                    .maybeSingle();

                const { data: ticketsWithOrders, error: tError } = await supabase
                    .from('tickets')
                    .select(`
                        id,
                        created_at,
                        order_id,
                        orders!inner (id, total, status, discount_amount),
                        ticket_types!inner (id, price, event_id)
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

                    const taxRate = eventTax ? parseFloat(eventTax.value || 0) : 0;
                    const isTaxIncluded = eventTax ? eventTax.is_included : false;

                    // 3. Calculate revenue: (Price + Tax - DiscountShare)
                    let calculatedSales = 0;
                    ticketsWithOrders.forEach(t => {
                        const totalTicketsInOrder = orderTicketCounts[t.order_id] || 1;
                        const basePrice = Number(t.ticket_types?.price || 0);

                        let ticketIncome = basePrice;
                        if (!isTaxIncluded && taxRate > 0) {
                            ticketIncome += (basePrice * taxRate / 100);
                        }

                        const discountShare = Number(t.orders?.discount_amount || 0) / totalTicketsInOrder;
                        ticketIncome -= discountShare;

                        calculatedSales += ticketIncome;
                        // Attach to ticket for ledger display
                        t.calculated_revenue = ticketIncome;
                    });

                    sales = calculatedSales;
                    ticketsForLedger = ticketsWithOrders;
                }
            }


            // 4. Fetch withdrawals linked to this event
            const { data: withdrawalData, error: withdrawalError } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false });

            if (withdrawalError) throw withdrawalError;

            const eventWithdrawals = withdrawalData.filter(w =>
                w.event_id === eventId || (w.description && w.description.includes(eventId))
            );

            // 5. Calculations
            const withdrawn = eventWithdrawals.reduce((acc, curr) => acc + (curr.status === 'approved' ? Number(curr.amount) : 0), 0);

            setTotalSales(sales);
            setTotalWithdrawn(withdrawn);
            setEventBalance(sales - withdrawn);
            setTransactions(ticketsForLedger || []);
            setWithdrawals(eventWithdrawals || []);

        } catch (error) {
            console.error('Error fetching event financials:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestWithdrawal = async (e) => {
        e.preventDefault();
        const amount = Number(withdrawAmount);

        if (amount > eventBalance) {
            alert("Saldo event tidak mencukupi.");
            return;
        }

        if (amount < 10000) {
            alert("Nominal minimal penarikan adalah Rp 10.000.");
            return;
        }

        const hasPending = withdrawals.some(w => w.status === 'pending');
        if (hasPending) {
            alert("Anda masih memiliki pengajuan penarikan yang sedang diproses untuk event ini.");
            return;
        }

        try {
            // Include event_id in description for admin context
            const description = `Event Withdrawal: ${eventData?.title || 'Unknown Event'} (Event ID: ${eventId})`;

            const { error } = await supabase
                .from('withdrawals')
                .insert({
                    creator_id: user.id,
                    amount: amount,
                    status: 'pending',
                    description: description,
                    // If your schema supports event_id directly, add it here:
                    // event_id: eventId 
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

    const exportFinancialReport = async () => {
        setIsExporting(true);
        try {
            await exportToPDF('financial-report-content', `Financial_Report_${eventData?.title || 'Event'}.pdf`);
        } finally {
            setIsExporting(false);
        }
    };

    if (loading && !eventData) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-[3px] border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Auditing Event Ledger...</span>
            </div>
        );
    }

    if (!isVerified) return <VerificationPending />;

    return (
        <div className="p-6 max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-600" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Internal Finance</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                        Event <span className="text-indigo-600 italic">Cash</span>
                    </h2>
                    <p className="text-slate-500 font-medium text-sm">Monitor pendapatan dan ajukan pencairan tiket.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportFinancialReport}
                        disabled={isExporting}
                        className="bg-emerald-50 text-emerald-700 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 border border-emerald-100 shadow-sm hover:bg-emerald-100 transition-all active:scale-95 text-sm"
                    >
                        <ArrowUpRight size={18} className={isExporting ? 'animate-spin' : ''} />
                        {isExporting ? 'Processing...' : 'Export Cash Flow'}
                    </button>
                    <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-500/20 hover:scale-105 hover:bg-indigo-700 transition-all active:scale-95 text-sm"
                    >
                        <PlusCircle size={18} />
                        Tarik Saldo Event
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Balance Card */}
                <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-10 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-indigo-600/30 transition-all duration-700" />

                    <div className="relative z-10 space-y-8">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/5">
                                    <Wallet size={28} className="text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Saldo Event Tersedia</p>
                                    <h3 className="text-4xl md:text-5xl font-black tracking-tight tabular-nums">{rupiah(eventBalance)}</h3>
                                </div>
                            </div>
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/10">Verified Ledger</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <ArrowDownLeft size={14} className="text-green-400" />
                                    <p className="text-white/40 text-[9px] font-black uppercase tracking-widest text-left">Total Penjualan Tiket</p>
                                </div>
                                <p className="text-xl font-bold tabular-nums">{rupiah(totalSales)}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <ArrowUpRight size={14} className="text-red-400" />
                                    <p className="text-white/40 text-[9px] font-black uppercase tracking-widest text-left">Total Dana Dicairkan</p>
                                </div>
                                <p className="text-xl font-bold tabular-nums">{rupiah(totalWithdrawn)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Event Info Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden relative group">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                                <Calendar size={18} />
                            </div>
                            <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Metadata Event</h4>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Event Title</p>
                                <p className="font-bold text-slate-800 line-clamp-2">{eventData?.title}</p>
                            </div>
                            <div className="flex gap-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                                    <p className="text-xs font-bold text-slate-600">{eventData?.event_date}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${eventData?.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500'
                                        }`}>
                                        {eventData?.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group-hover:bg-indigo-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <Building2 size={16} className="text-slate-400 group-hover:text-indigo-400" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{creatorInfo?.bank_name || 'No Bank Info'}</span>
                        </div>
                        <CreditCard size={14} className="text-slate-300" />
                    </div>
                </div>
            </div>

            {/* Tables Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Withdrawal History */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Pengajuan Penarikan</h3>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Activity</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Amount</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {withdrawals.length > 0 ? withdrawals.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                                                        <Clock size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">{new Date(req.created_at).toLocaleDateString()}</p>
                                                        <p className="text-xs font-bold text-slate-700">Withdrawal Req</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <p className="font-black text-slate-900 text-sm tabular-nums">{rupiah(req.amount)}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end">
                                                    <StatusBadge status={req.status} />
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center">
                                                <div className="text-slate-300 italic flex flex-col items-center gap-2">
                                                    <Search size={24} className="opacity-20" />
                                                    <span className="text-xs font-bold uppercase tracking-widest opacity-40">Belum ada pengajuan</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sales Ledger */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Laporan Penjualan</h3>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incoming Sales</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-[13px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Source</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {transactions.length > 0 ? transactions.slice(0, 8).map((h) => (
                                        <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50 text-green-600 border border-green-100">
                                                        <ArrowDownLeft size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 leading-tight mb-1 line-clamp-1">Order #{h.orders.id.substring(0, 8)}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(h.created_at).toLocaleDateString()} • Ticket Credit</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="font-black text-green-600 tabular-nums">+{rupiah(h.calculated_revenue || 0)}</p>
                                            </td>

                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="2" className="px-6 py-12 text-center text-slate-300 italic text-xs font-bold uppercase tracking-widest opacity-40">Belum ada transaksi</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {transactions.length > 8 && (
                            <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
                                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:text-indigo-700 transition-colors">See Full Transaction History</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Withdrawal Modal */}
            {isRequestModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsRequestModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                            <h2 className="text-2xl font-black text-slate-900">Pencairan <span className="text-indigo-600 italic">Saldo</span></h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                <Info size={12} className="text-amber-500" />
                                Minimal Penarikan Rp 10.000
                            </p>
                        </div>

                        <form onSubmit={handleRequestWithdrawal} className="p-6 space-y-6">
                            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Saldo Event Tersedia</p>
                                    <p className="font-black text-indigo-900 text-lg tabular-nums">{rupiah(eventBalance)}</p>
                                </div>
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                    <Wallet size={20} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nominal Pencairan</label>
                                    <div className="relative group/input">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 group-focus-within/input:text-indigo-500 transition-colors">Rp</span>
                                        <input
                                            required
                                            type="number"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-5 pl-12 pr-6 font-black text-xl text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all tabular-nums"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <p className="text-[10px] font-bold text-amber-700 leading-relaxed italic">
                                        * Dana akan ditransfer ke rekening {creatorInfo?.bank_name} - {creatorInfo?.bank_account}.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRequestModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 text-sm"
                                >
                                    Ajukan Sekarang
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Hidden Financial Report Template */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <FormalReport 
                    type="event_cash_creator" 
                    data={{ 
                        totalSales, 
                        totalWithdrawn, 
                        eventBalance, 
                        withdrawals: withdrawals 
                    }} 
                    creatorInfo={creatorInfo} 
                    eventData={eventData} 
                />
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const configs = {
        pending: { label: 'Pending', icon: Clock, className: 'bg-slate-100 text-slate-600 border-slate-200' },
        approved: { label: 'Approved', icon: CheckCircle2, className: 'bg-green-50 text-green-600 border-green-100' },
        rejected: { label: 'Rejected', icon: XCircle, className: 'bg-red-50 text-red-600 border-red-100' },
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
