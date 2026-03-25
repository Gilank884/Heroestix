import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    Wallet,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    CheckCircle2,
    XCircle,
    MoreVertical,
    Building2,
    AlertCircle,
    Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function Withdrawals() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ total_pending: 0, total_processed: 0, pending_amount: 0 });
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionType, setActionType] = useState('approve');
    const [actionAmount, setActionAmount] = useState(0);
    const [processing, setProcessing] = useState(false);

    const [creatorStats, setCreatorStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchCreatorStats = async (creatorId) => {
        setStatsLoading(true);
        try {
            const [ticketsRes, withdrawalRes, taxesRes] = await Promise.all([
                supabase
                    .from('tickets')
                    .select('id, order_id, orders!inner(id, total, status, discount_amount), ticket_types!inner(id, price, events!inner(id, creator_id))')
                    .eq('orders.status', 'paid')
                    .eq('ticket_types.events.creator_id', creatorId),
                supabase.from('withdrawals').select('*').eq('creator_id', creatorId),
                supabase.from('event_taxes').select('*')
            ]);

            const paidTickets = ticketsRes.data || [];
            const withdrawalData = withdrawalRes.data || [];
            const taxes = taxesRes.data || [];
            const taxMap = taxes.reduce((acc, t) => ({ ...acc, [t.event_id]: t }), {});

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
                    const ticketType = t.ticket_types;
                    const eventTax = taxMap[ticketType.events?.id];
                    
                    const basePrice = Number(ticketType.price || 0);
                    const taxRate = eventTax ? parseFloat(eventTax.value || 0) : 0;
                    const isTaxIncluded = eventTax ? eventTax.is_included : false;
                    
                    let ticketIncome = basePrice;
                    if (!isTaxIncluded && taxRate > 0) {
                        ticketIncome += (basePrice * taxRate / 100);
                    }
                    
                    const discountShare = Number(t.orders.discount_amount || 0) / countInOrder;
                    ticketIncome -= discountShare;
                    
                    netSales += ticketIncome;
                });
            }


            // Calculate Total Already Withdrawn (approved requests)
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

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            // Fetch withdrawals with creator and profile details
            const { data, error } = await supabase
                .from('withdrawals')
                .select(`
                    *,
                    creators:creator_id (
                        brand_name,
                        bank_name,
                        bank_account,
                        profiles (
                            full_name,
                            email
                        )
                    ),
                    events:event_id (
                        title
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching withdrawals:', error.message);
                throw error;
            }

            setRequests(data);
            calculateStats(data);
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const pending = data.filter(r => r.status === 'pending');
        const processed = data.filter(r => r.status === 'approved');

        setStats({
            total_pending: pending.length,
            total_processed: processed.length,
            pending_amount: pending.reduce((acc, curr) => acc + Number(curr.amount), 0)
        });
    };

    const handleOpenProcessModal = (request) => {
        navigate(`/withdrawals/${request.id}`);
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <img src="/Logo/Logo.png" alt="Heroestix" className="h-8 w-auto" />
                            <div className="w-1 h-6 bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em]">Funding Operations</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-medium tracking-tight text-slate-900 italic">Merchant <span className="text-blue-600 not-italic">Withdrawals</span></h1>
                        <p className="text-slate-500 font-medium text-sm mt-2">Review and process creator payout requests.</p>
                    </div>
                    <button
                        onClick={fetchWithdrawals}
                        className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all active:scale-95 shadow-sm flex items-center gap-2"
                    >
                        <Clock size={16} />
                        Refresh Sync
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Requests</p>
                        <h3 className="text-3xl font-black text-slate-900">{stats.total_pending}</h3>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                        <Clock size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">To Be Paid</p>
                        <h3 className="text-3xl font-black text-slate-900">{rupiah(stats.pending_amount)}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Wallet size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Processed</p>
                        <h3 className="text-3xl font-black text-slate-900">{stats.total_processed}</h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <CheckCircle2 size={24} />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by creator name or ID..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        />
                    </div>
                    <button className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                        <Filter size={18} />
                    </button>
                    <button className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                        <Download size={18} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Request ID</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Creator Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Info</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {requests.map((req) => (
                                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs font-bold text-slate-500">#{req.id.substring(0, 8)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 text-sm">{req.creators?.profiles?.full_name || req.creators?.brand_name || 'Unknown'}</span>
                                            <span className="text-xs text-slate-400">{req.creators?.profiles?.email}</span>
                                            {req.events?.title && (
                                                <span className="text-[10px] text-blue-600 font-bold mt-1 bg-blue-50 w-fit px-1.5 py-0.5 rounded">
                                                    Event: {req.events.title}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 text-xs">{req.creators?.bank_name}</span>
                                            <span className="text-xs font-mono text-slate-500">{req.creators?.bank_account}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-slate-900">{rupiah(req.amount)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-slate-500">
                                            {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        <p className="text-[10px] text-slate-400">
                                            {new Date(req.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <StatusBadge status={req.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleOpenProcessModal(req)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                                req.status === 'pending'
                                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                            }`}
                                        >
                                            {req.status === 'pending' ? 'Review' : 'Detail'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <p className="text-slate-400 text-sm font-medium italic">No withdrawal requests found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Withdrawal Modal Removed in favor of dedicated page */}
        </div>
    );
}

function StatusBadge({ status }) {
    const configs = {
        pending: { label: 'Pending Review', icon: Clock, className: 'bg-amber-50 text-amber-600 border-amber-100' },
        approved: { label: 'Paid / Done', icon: CheckCircle2, className: 'bg-blue-50 text-blue-600 border-blue-100' },
        rejected: { label: 'Rejected', icon: XCircle, className: 'bg-red-50 text-red-600 border-red-100' },
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center justify-end gap-1.5 w-fit ml-auto border ${config.className}`}>
            <Icon size={12} />
            {config.label}
        </div>
    );
}
