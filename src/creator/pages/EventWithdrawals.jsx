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
    AlertCircle
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

            // 3. Calculate Balance (Credit from sales - Already withdrawn for this event)
            let salesTotal = 0;
            if (tIds.length > 0) {
                const { data: bData } = await supabase
                    .from('creator_balances')
                    .select('amount')
                    .in('ticket_id', tIds)
                    .eq('type', 'credit');
                salesTotal = (bData || []).reduce((acc, curr) => acc + (Number(curr.amount) - 8500), 0);
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

    if (loading && !eventData) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-[3px] border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Menghitung Saldo Event...</span>
            </div>
        );
    }

    return (
        <div className="p-8 pt-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Keuangan Event</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Penarikan Saldo
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">Cairkan pendapatan khusus dari event <span className="text-slate-900 font-semibold">{eventData?.title}</span></p>
                </div>
                <button
                    onClick={handleRequestWithdrawal}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 text-sm"
                >
                    <PlusCircle size={18} />
                    Tarik Saldo
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32" />

                    <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/5">
                                <Wallet size={28} className="text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-white/40 font-medium text-[11px] uppercase tracking-widest mb-1">Saldo Tersedia</p>
                                <h3 className="text-4xl font-bold tracking-tight tabular-nums">{rupiah(balance)}</h3>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-white/30">
                            <Info size={14} />
                            <p className="text-[10px] font-medium uppercase tracking-widest">Maksimal 3 hari pengerjaan</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Building2 size={16} />
                        </div>
                        <h4 className="font-medium text-slate-400 uppercase text-[10px] tracking-widest">Rekening Tujuan</h4>
                    </div>

                    {creatorInfo?.bank_account ? (
                        <div className="space-y-3">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Bank</p>
                                <p className="font-semibold text-slate-800 text-sm">{creatorInfo.bank_name}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Nomor Rekening</p>
                                <p className="font-semibold text-slate-800 tracking-wider flex items-center gap-2 text-sm">
                                    <CreditCard size={14} className="text-slate-400" />
                                    {creatorInfo.bank_account}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-amber-50 rounded-2xl border border-amber-100 text-center gap-3">
                            <AlertCircle size={24} className="text-amber-500" />
                            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Data Bank Belum Diatur</p>
                        </div>
                    )}
                </div>
            </div>

            {/* History */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-5 bg-indigo-600 rounded-full" />
                    <h3 className="text-lg font-semibold text-slate-900">Riwayat Penarikan</h3>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">ID Penarikan</th>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Tanggal</th>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Nominal</th>
                                    <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {requests.length > 0 ? requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-slate-700 tracking-tight">WD-{req.id.substring(0, 8).toUpperCase()}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium">
                                            {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-900">
                                            {rupiah(req.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end">
                                                <StatusBadge status={req.status} />
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-medium">Belum ada data penarikan</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Retired */}
        </div>
    );
}

function StatusBadge({ status }) {
    const configs = {
        pending: { label: 'Proses', icon: Clock, className: 'bg-amber-50 text-amber-600 border-amber-100' },
        approved: { label: 'Cair', icon: CheckCircle2, className: 'bg-green-50 text-green-600 border-green-100' },
        rejected: { label: 'Batal', icon: XCircle, className: 'bg-red-50 text-red-600 border-red-100' },
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
