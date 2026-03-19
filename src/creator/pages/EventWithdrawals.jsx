import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    AlertCircle,
    Search,
    TrendingUp,
    FileCheck
} from 'lucide-react';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function EventWithdrawals() {
    const { id: eventId } = useParams();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [eventData, setEventData] = useState(null);
    const [balance, setBalance] = useState(0);
    const [requests, setRequests] = useState([]);
    const [totalWithdrawn, setTotalWithdrawn] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [creatorInfo, setCreatorInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.id && eventId) {
            fetchEventFinancials();
            fetchCreatorInfo();
        }
    }, [user?.id, eventId]);

    const fetchCreatorInfo = async () => {
        const { data } = await supabase
            .from('creators')
            .select('*')
            .eq('id', user.id)
            .single();
        setCreatorInfo(data);
    };

    const fetchEventFinancials = async () => {
        setLoading(true);
        try {
            // 1. Fetch Event Details
            const { data: event } = await supabase
                .from('events')
                .select('title')
                .eq('id', eventId)
                .single();
            setEventData(event);

            // 2. Fetch related ticket types
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

            // 3. Calculate Balance using Fair-Share Orders Logic
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
                    // To handle orders with multiple tickets fairly:
                    // 1. Get all unique order IDs
                    const orderIds = [...new Set(eventTickets.map(t => t.order_id))];

                    // 2. Fetch total ticket count for EACH of these orders (to split revenue)
                    const { data: allTicketsInOrders } = await supabase
                        .from('tickets')
                        .select('order_id')
                        .in('order_id', orderIds);

                    const orderTicketCounts = {};
                    allTicketsInOrders?.forEach(t => {
                        orderTicketCounts[t.order_id] = (orderTicketCounts[t.order_id] || 0) + 1;
                    });

                    // 3. Calculate revenue: (Order Total / Total Tickets) - 8500 per ticket
                    eventTickets.forEach(t => {
                        const totalTicketsInOrder = orderTicketCounts[t.order_id] || 1;
                        const shareOfGross = Number(t.orders.total) / totalTicketsInOrder;
                        salesTotal += (shareOfGross - 8500);
                    });
                }
            }

            // 4. Fetch Withdrawals for this event
            const { data: withdrawalData } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false });

            // Filter withdrawals related to this event (check description or event_id if exists)
            const eventWithdrawals = (withdrawalData || []).filter(w =>
                (w.description && w.description.includes(eventId)) || w.event_id === eventId
            );

            const withdrawnTotal = eventWithdrawals
                .filter(w => w.status === 'approved')
                .reduce((acc, curr) => acc + Number(curr.amount), 0);

            setBalance(salesTotal - withdrawnTotal);
            setTotalWithdrawn(withdrawnTotal);
            setRequests(eventWithdrawals);

        } catch (error) {
            console.error('Error fetching event financials:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestWithdrawal = () => {
        navigate(`/manage/event/${eventId}/withdrawals/request`);
    };

    const filteredRequests = requests.filter(req =>
        req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.amount.toString().includes(searchQuery) ||
        req.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && !eventData) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-[3px] border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Menghitung Saldo Event...</span>
            </div>
        );
    }

    return (
        <div className="space-y-10">


            {/* 2. Premium 3-Column Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Available Balance Card */}
                <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-indigo-600/30 transition-all duration-700" />

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/5">
                                <Wallet size={24} className="text-indigo-400" />
                            </div>
                            <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Available</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest leading-none">Saldo Tersedia</p>
                            <h3 className="text-3xl font-black tracking-tight tabular-nums">{rupiah(balance)}</h3>
                        </div>
                    </div>
                </div>

                {/* Total Withdrawn Card */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                            <FileCheck size={24} />
                        </div>
                        <TrendingUp size={20} className="text-slate-200 group-hover:text-indigo-200 transition-colors" />
                    </div>
                    <div className="space-y-1 mt-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Telah Cair</p>
                        <h4 className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">{rupiah(totalWithdrawn)}</h4>
                    </div>
                </div>

                {/* Bank Account Card */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-500">
                            <Building2 size={24} />
                        </div>
                        <CreditCard size={20} className="text-slate-200" />
                    </div>
                    <div className="space-y-1 mt-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Rekening Tujuan</p>
                        {creatorInfo?.bank_account ? (
                            <div>
                                <h4 className="text-lg font-black text-slate-900 truncate">{creatorInfo.bank_name}</h4>
                                <p className="text-sm font-bold text-slate-500 tracking-wider">
                                    {creatorInfo.bank_account}
                                </p>
                                <p className="text-sm font-bold text-slate-500 tracking-wider">
                                    {creatorInfo.account_bank_name}
                                </p>

                            </div>
                        ) : (
                            <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Belum Diatur</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Functional Toolbar & History Table */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRequestWithdrawal}
                            disabled={balance < 100000}
                            className={`group flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg ${balance >= 100000
                                ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            <PlusCircle size={18} />
                            Tarik Saldo
                        </button>
                        <div className="h-8 w-px bg-slate-100 mx-2 hidden md:block" />
                        <div className="flex items-center gap-2 text-slate-400">
                            <Info size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Min. Rp 100rb</span>
                        </div>
                    </div>

                    <div className="relative group w-full md:w-80">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari riwayat..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-16">#</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Referensi</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tanggal</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nominal</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRequests.length > 0 ? filteredRequests.map((req, index) => (
                                    <tr 
                                        key={req.id} 
                                        onClick={() => navigate(`/manage/event/${eventId}/withdrawals/${req.id}`)}
                                        className="group hover:bg-slate-50/50 transition-all cursor-pointer text-sm"
                                    >
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-black text-slate-300 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-900 tracking-tight">WD-{req.id.substring(0, 8).toUpperCase()}</p>
                                        </td>
                                        <td className="px-8 py-6 text-slate-500 font-semibold italic">
                                            {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-black text-slate-900 tabular-nums tracking-tight">{rupiah(req.amount)}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-end">
                                                <StatusBadge status={req.status} />
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                <AlertCircle size={40} className="text-slate-400" />
                                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 italic">Belum ada data penarikan</p>
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

function StatusBadge({ status }) {
    const configs = {
        pending: { label: 'Proses', icon: Clock, className: 'bg-amber-50 text-amber-600 border-amber-100' },
        approved: { label: 'Cair', icon: FileCheck, className: 'bg-blue-50 text-blue-600 border-blue-100' },
        rejected: { label: 'Batu', icon: XCircle, className: 'bg-rose-50 text-rose-600 border-rose-100' },
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
        <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-2 w-fit border-2 ${config.className} shadow-sm`}>
            <Icon size={12} strokeWidth={3} />
            {config.label}
        </div>
    );
}
