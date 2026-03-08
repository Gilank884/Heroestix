import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Calendar,
    CreditCard,
    Tag,
    Clock,
    ClipboardList,
    ChevronRight
} from 'lucide-react';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function SalesDetail() {
    const { id: eventId, ticketId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [ticket, setTicket] = useState(null);
    const [orderTicketCount, setOrderTicketCount] = useState(1);

    useEffect(() => {
        if (ticketId) {
            fetchTicketDetail();
        }
    }, [ticketId]);

    const fetchTicketDetail = async () => {
        setLoading(true);
        try {
            // 1. Fetch Ticket with Order and Ticket Type
            const { data, error } = await supabase
                .from('tickets')
                .select(`
                    *,
                    orders!inner (*),
                    ticket_types!inner (name)
                `)
                .eq('id', ticketId)
                .single();

            if (error) throw error;
            setTicket(data);

            // 2. Fetch how many tickets are in this order to calculate revenue share
            if (data?.order_id) {
                const { count } = await supabase
                    .from('tickets')
                    .select('*', { count: 'exact', head: true })
                    .eq('order_id', data.order_id);

                setOrderTicketCount(count || 1);
            }
        } catch (err) {
            console.error('Error fetching ticket detail:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Memuat Detail...</p>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-slate-50 p-10">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 font-bold text-xs uppercase tracking-widest">
                    <ArrowLeft size={16} /> Kembali
                </button>
                <div className="bg-white rounded-[40px] p-20 text-center border border-slate-100 shadow-sm">
                    <p className="text-slate-400 font-bold uppercase tracking-widest">Data tidak ditemukan</p>
                </div>
            </div>
        );
    }

    const customResponses = typeof ticket.custom_responses === 'string'
        ? JSON.parse(ticket.custom_responses || '{}')
        : (ticket.custom_responses || {});

    const netRevenue = (Number(ticket.orders?.total || 0) / orderTicketCount) - 8500;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header / Breadcrumb */}
            <div className="max-w-5xl mx-auto px-6 pt-10 pb-6">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate(`/manage/event/${eventId}/sales-report`)}
                        className="group flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all active:scale-95"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Kembali</span>
                    </button>

                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        <span>Laporan Penjualan</span>
                        <ChevronRight size={12} />
                        <span className="text-slate-400">Detail Pembeli</span>
                        <ChevronRight size={12} />
                        <span className="text-blue-600">{ticket.full_name}</span>
                    </div>
                </div>

                {/* Main Hero Card */}
                <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
                    <div className="p-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-24 h-24 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200 transform group-hover:rotate-6 transition-transform duration-500">
                            <User size={48} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">
                                {ticket.full_name || 'Tanpa Nama'}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                                    <Tag size={14} className="text-slate-400" />
                                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{ticket.qr_code}</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl">
                                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{ticket.ticket_types?.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Section: Personal Info */}
                <div className="lg:col-span-12 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Box: Personal */}
                        <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 border-b border-slate-100 pb-4 flex items-center gap-2">
                                <User size={16} className="text-blue-500" />
                                Informasi Pribadi
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                                    <div className="flex items-center gap-3 group/item">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-blue-50 group-hover/item:text-blue-600 transition-colors">
                                            <Mail size={16} />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-900">{ticket.email || '-'}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telepon</p>
                                    <div className="flex items-center gap-3 group/item">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-blue-50 group-hover/item:text-blue-600 transition-colors">
                                            <Phone size={16} />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-900">{ticket.phone || '-'}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jenis Kelamin</p>
                                    <div className="flex items-center gap-3 group/item">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-black text-[10px] group-hover/item:bg-blue-50 group-hover/item:text-blue-600 transition-colors">
                                            G
                                        </div>
                                        <p className="text-sm font-semibold text-slate-900">{ticket.gender || '-'}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Lahir</p>
                                    <div className="flex items-center gap-3 group/item">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-blue-50 group-hover/item:text-blue-600 transition-colors">
                                            <Calendar size={16} />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-900">{ticket.birth_date || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Box: Order */}
                        <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 border-b border-slate-100 pb-4 flex items-center gap-3">
                                <CreditCard size={16} className="text-blue-500" />
                                Detail Pesanan
                            </h4>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                                            <Tag size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</p>
                                            <p className="text-xs font-black text-slate-900 tracking-wider mt-0.5">#{ticket.orders?.id?.toUpperCase() || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu Pembelian</p>
                                            <p className="text-xs font-bold text-slate-700 mt-0.5">
                                                {ticket.orders?.created_at
                                                    ? new Date(ticket.orders.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                    : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Potensi Pendapatan Bersih</p>
                                    <div className="flex items-center gap-3 group/item">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-blue-600 font-black text-[10px] group-hover/item:bg-blue-100 transition-colors">
                                            Rp
                                        </div>
                                        <p className="text-sm font-black text-blue-700">{rupiah(netRevenue)} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">/ Tiket</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Box: Custom Responses */}
                    {Object.keys(customResponses).length > 0 && (
                        <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 border-b border-slate-100 pb-4 flex items-center gap-3">
                                <ClipboardList size={16} className="text-blue-500" />
                                Data Formulir Tambahan
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {Object.entries(customResponses).map(([key, value]) => (
                                    <div key={key} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group/custom">
                                        <p className="text-[10px] font-black text-slate-400 group-hover/custom:text-blue-400 uppercase tracking-widest mb-2 transition-colors">{key}</p>
                                        <p className="text-base font-black text-slate-800 group-hover/custom:text-blue-900 transition-colors">{String(value)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
