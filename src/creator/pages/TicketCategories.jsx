import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    Search,
    Plus,
    MoreVertical,
    Edit2,
    Trash2,
    Ticket,
    Activity,
    Calendar,
    ChevronRight,
    Filter,
    Info,
    Tag
} from 'lucide-react';


const TicketCategories = () => {
    const { id: eventId } = useParams();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTickets = async () => {
        try {
            const { data, error } = await supabase
                .from('ticket_types')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setTickets(data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [eventId]);



    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const filteredTickets = tickets.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        {
            label: 'Total Kategori',
            value: tickets.length,
            icon: Tag,
            color: 'bg-blue-50 text-blue-600'
        },
        {
            label: 'Total Kuota',
            value: tickets.reduce((acc, t) => acc + (t.quota || 0), 0),
            icon: Ticket,
            color: 'bg-purple-50 text-purple-600'
        },
        {
            label: 'Tiket Terjual',
            value: tickets.reduce((acc, t) => acc + (t.sold || 0), 0),
            icon: Activity,
            color: 'bg-emerald-50 text-emerald-600'
        }
    ];

    return (
        <div className="space-y-8 pb-20 max-w-[1200px] mx-auto">
            {/* Header Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 group hover:border-[#1a36c7]/30 transition-all">
                        <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                            <stat.icon size={28} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900 leading-none">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-6">
                {/* Search & Action Header */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari kategori tiket..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 focus:border-[#1a36c7] transition-all placeholder:text-slate-300 text-sm"
                            />
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button className="h-[60px] px-6 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all shadow-sm flex items-center justify-center gap-2">
                                <Filter size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Filter</span>
                            </button>
                            
                            <button
                                onClick={() => navigate('create')}
                                className="h-[60px] pl-5 pr-7 rounded-2xl bg-[#1a36c7] text-white hover:bg-[#1a36c7]/90 transition-all shadow-lg shadow-[#1a36c7]/20 flex items-center justify-center gap-3 group active:scale-95"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:rotate-90 transition-transform">
                                    <Plus size={20} />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest leading-none">Tambah Tiket</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori Tiket</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Harga</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="3" className="px-6 py-8 bg-slate-50/10"></td>
                                        </tr>
                                    ))
                                ) : filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-6 max-w-sm mx-auto">
                                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 rotate-12 group hover:rotate-0 transition-transform cursor-pointer">
                                                    <Ticket size={40} />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black text-slate-900 uppercase tracking-wider">Belum Ada Tiket</p>
                                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">Mulai buat kategori tiket pertama Anda untuk event ini!</p>
                                                </div>
                                                <button
                                                    onClick={() => navigate('create')}
                                                    className="px-8 py-4 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
                                                >
                                                    Buat Tiket Pertama
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredTickets.map((ticket, index) => (
                                    <tr
                                        key={ticket.id}
                                        onClick={() => navigate(`/manage/event/${eventId}/ticket-categories/${ticket.id}/edit`)}
                                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] shrink-0 mt-1">
                                                    {index + 1}
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className="text-[13px] font-black text-slate-900 tracking-tight group-hover:text-[#1a36c7] transition-colors">{ticket.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md">
                                                            <Activity size={10} className="text-[#1a36c7]" />
                                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{ticket.sold} / {ticket.quota} Terjual</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#1a36c7] transition-all duration-500 rounded-full"
                                                            style={{ width: `${Math.min((ticket.sold / ticket.quota) * 100, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className="text-[13px] font-black text-[#1a36c7] bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100">{formatPrice(ticket.price)}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`text-[10px] px-3.5 py-2 rounded-xl font-black uppercase tracking-widest ${ticket.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {ticket.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#1a36c7] animate-pulse"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total {tickets.length} Kategori Ditemukan</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketCategories;
