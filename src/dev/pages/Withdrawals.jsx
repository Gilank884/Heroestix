import React, { useState, useEffect } from 'react';
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
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ total_pending: 0, total_processed: 0, pending_amount: 0 });
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);

    const [creatorStats, setCreatorStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    useEffect(() => {
        fetchWithdrawals();
    }, []);

    const fetchCreatorStats = async (creatorId) => {
        setStatsLoading(true);
        try {
            // Updated to Fair-Share Orders Logic
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
        setSelectedRequest(request);
        setActionAmount(request.amount);
        setActionType('approve');
        setIsProcessModalOpen(true);
        fetchCreatorStats(request.creator_id);
    };

    const handleProcess = async () => {
        if (!selectedRequest) return;
        setProcessing(true);

        try {
            const updates = {
                status: actionType === 'approve' ? 'approved' : 'rejected',
                updated_at: new Date().toISOString()
            };

            if (actionType === 'approve') {
                updates.amount = actionAmount; // Update amount with confirmed value
            }

            const { error } = await supabase
                .from('withdrawals')
                .update(updates)
                .eq('id', selectedRequest.id);

            if (error) throw error;

            // Optimistic update
            setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, ...updates } : r));
            calculateStats(requests.map(r => r.id === selectedRequest.id ? { ...r, ...updates } : r));

            setIsProcessModalOpen(false);
        } catch (error) {
            alert('Error processing withdrawal: ' + error.message);
        } finally {
            setProcessing(false);
        }
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
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Withdrawals</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage creator payout requests and history.</p>
                </div>
                <button
                    onClick={fetchWithdrawals}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    <Clock size={16} />
                    Refresh
                </button>
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
                                        {req.status === 'pending' && (
                                            <button
                                                onClick={() => handleOpenProcessModal(req)}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-100 transition-colors"
                                            >
                                                Review
                                            </button>
                                        )}
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

            {/* Process Modal */}
            <AnimatePresence>
                {isProcessModalOpen && selectedRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsProcessModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Process Action</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: #{selectedRequest.id.substring(0, 8)}</p>
                                </div>
                                <button
                                    onClick={() => setIsProcessModalOpen(false)}
                                    className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-200"
                                >
                                    <XCircle size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Creator Info */}
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                                            {(selectedRequest.creators?.profiles?.full_name || selectedRequest.creators?.brand_name || 'U').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{selectedRequest.creators?.profiles?.full_name || selectedRequest.creators?.brand_name || 'Unknown'}</p>
                                            <p className="text-xs text-slate-500">{selectedRequest.creators?.profiles?.email}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200/50">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank Name</p>
                                            <p className="text-sm font-bold text-slate-800">{selectedRequest.creators?.bank_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Number</p>
                                            <p className="text-sm font-mono font-bold text-slate-800">{selectedRequest.creators?.bank_account}</p>
                                        </div>
                                    </div>

                                    {/* Financial Stats in Modal */}
                                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200/50">
                                        {statsLoading ? (
                                            <div className="col-span-2 text-center text-xs text-slate-400 py-2 italic animate-pulse">Calculating creator balance...</div>
                                        ) : creatorStats ? (
                                            <>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Sales (All Time)</p>
                                                    <p className="text-sm font-bold text-slate-800">{rupiah(creatorStats.netSales)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Balance</p>
                                                    <p className="text-sm font-bold text-blue-600">{rupiah(creatorStats.balance)}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="col-span-2 text-center text-xs text-slate-400 py-2">Stats unavailable</div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Form */}
                                <div className="space-y-4">
                                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                        <button
                                            onClick={() => setActionType('approve')}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${actionType === 'approve'
                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                : 'text-slate-500 hover:bg-slate-200'
                                                }`}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => setActionType('reject')}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${actionType === 'reject'
                                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                                : 'text-slate-500 hover:bg-slate-200'
                                                }`}
                                        >
                                            Reject
                                        </button>
                                    </div>

                                    {actionType === 'approve' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Confirmed Amount</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                                                <input
                                                    type="number"
                                                    value={actionAmount}
                                                    onChange={(e) => setActionAmount(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-emerald-100 rounded-xl font-bold text-emerald-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium">Original Request: {rupiah(selectedRequest.amount)}</p>
                                        </div>
                                    )}

                                    {actionType === 'reject' && (
                                        <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-red-700 text-sm font-medium">
                                            This action will reject the withdrawal request. The creator will be notified (if implemented).
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleProcess}
                                    disabled={processing}
                                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm shadow-xl transition-all active:scale-95 ${actionType === 'approve'
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20'
                                        : 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/20'
                                        }`}
                                >
                                    {processing ? 'Processing...' : (actionType === 'approve' ? 'Confirm Transfer' : 'Reject Request')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatusBadge({ status }) {
    const configs = {
        pending: { label: 'Pending Review', icon: Clock, className: 'bg-amber-50 text-amber-600 border-amber-100' },
        approved: { label: 'Paid / Done', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
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
