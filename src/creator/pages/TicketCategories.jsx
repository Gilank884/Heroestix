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
    Info
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

    const handleToggleStatus = async (ticketId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            const { error } = await supabase
                .from('ticket_types')
                .update({ status: newStatus })
                .eq('id', ticketId);

            if (error) throw error;
            setTickets(tickets.map(t =>
                t.id === ticketId ? { ...t, status: newStatus } : t
            ));
        } catch (error) {
            alert('Error updating status: ' + error.message);
        }
    };

    const handleDelete = async (ticketId) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus kategori tiket ini?')) return;
        try {
            const { error } = await supabase
                .from('ticket_types')
                .delete()
                .eq('id', ticketId);

            if (error) throw error;
            setTickets(tickets.filter(t => t.id !== ticketId));
        } catch (error) {
            alert('Error deleting ticket: ' + error.message);
        }
    };

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

    return (
        <div className="space-y-8 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Main Content Area */}
                <div className="lg:col-span-9 order-2 lg:order-1 space-y-6">
                    {/* Search & Filter Header */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cari kategori tiket..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 focus:border-[#1a36c7] transition-all placeholder:text-slate-300"
                                />
                            </div>
                            <button className="h-[60px] px-6 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all shadow-sm flex items-center justify-center gap-2">
                                <Filter size={18} />
                                <span className="text-xs font-black uppercase tracking-widest leading-none">Filter</span>
                            </button>
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori Tiket</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Harga</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        Array(3).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan="4" className="px-8 py-10 bg-slate-50/10"></td>
                                            </tr>
                                        ))
                                    ) : filteredTickets.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-24 text-center">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                        <Ticket size={40} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-lg font-black text-slate-900 uppercase tracking-wider">Belum Ada Tiket</p>
                                                        <p className="text-slate-400 text-sm font-medium">Kategori tiket yang Anda cari tidak ditemukan.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredTickets.map((ticket, index) => (
                                        <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs shrink-0 mt-1">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 tracking-tight">{ticket.name}</p>
                                                        <div className="flex items-center gap-2 mt-1.5 bg-slate-100 w-fit px-3 py-1 rounded-full">
                                                            <Activity size={10} className="text-[#1a36c7]" />
                                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{ticket.sold} / {ticket.quota} Terjual</span>
                                                        </div>
                                                        <div className="w-32 h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
                                                            <div
                                                                className="h-full bg-[#1a36c7] transition-all duration-500"
                                                                style={{ width: `${(ticket.sold / ticket.quota) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="text-sm font-black text-[#1a36c7] bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">{formatPrice(ticket.price)}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(ticket.id, ticket.status)}
                                                        className={`
                                                            relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300
                                                            ${ticket.status === 'active' ? 'bg-[#1a36c7] shadow-lg shadow-blue-500/20' : 'bg-slate-200'}
                                                        `}
                                                    >
                                                        <span
                                                            className={`
                                                                inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 shadow-sm
                                                                ${ticket.status === 'active' ? 'translate-x-[24px]' : 'translate-x-1'}
                                                            `}
                                                        />
                                                    </button>
                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${ticket.status === 'active' ? 'text-blue-600' : 'text-slate-400'}`}>
                                                        {ticket.status === 'active' ? 'Penjualan Aktif' : 'Terhenti'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => navigate(`edit/${ticket.id}`)}
                                                        className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(ticket.id)}
                                                        className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination/Summary Footer */}
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total {tickets.length} Kategori Ditemukan</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Sidebar */}
                <aside className="lg:col-span-3 order-1 lg:order-2 space-y-6 lg:sticky lg:top-8">
                    {/* Action Card */}
                    <div className="bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-sm space-y-6">
                        <div className="space-y-2 px-2">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Aksi Cepat</p>
                            <h4 className="text-xl font-black text-slate-900 leading-tight">Kelola Penjualan</h4>
                        </div>

                        <button
                            onClick={() => navigate('create')}
                            className="w-full flex items-center justify-center gap-2.5 bg-[#1a36c7] text-white py-4 rounded-2xl font-bold text-xs shadow-xl shadow-blue-500/20 hover:bg-[#152ba3] transition-all transform hover:-translate-y-1 active:scale-95 group"
                        >
                            <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-transform group-hover:rotate-90">
                                <Plus size={16} />
                            </span>
                            Tambah Tiket Baru
                        </button>
                    </div>

                    {/* Tutorial Card */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="relative z-10 space-y-6">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                <Info size={24} className="text-blue-400" />
                            </div>
                            <div className="space-y-2">
                                <h5 className="text-lg font-black tracking-tight">Butuh Bantuan?</h5>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                    Anda dapat mengatur kuota, periode penjualan, dan status tiket secara mandiri. Gunakan "Filter" untuk pencarian lebih mendalam.
                                </p>
                            </div>
                            <button className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest hover:gap-3 transition-all">
                                Lihat Panduan <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default TicketCategories;
