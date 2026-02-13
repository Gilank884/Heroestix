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
    Filter
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
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg font-black text-slate-900 flex items-center gap-3">
                        Kategori <span className="text-[#1a36c7]">Tiket</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5 text-slate-400">
                        <Activity size={12} className="text-green-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Manajemen Penjualan Langsung</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">

                    <button
                        onClick={() => navigate('create')}
                        className="px-6 py-2.5 rounded-xl bg-[#1a36c7] text-white font-bold text-[11px] uppercase hover:bg-[#152ba3] transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={16} /> Tambah Tiket
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                {/* Table Control */}
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-4 bg-slate-50/30">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari kategori tiket..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 focus:border-[#1a36c7] transition-all placeholder:text-slate-300 shadow-sm"
                        />
                    </div>
                    <button className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all shadow-sm">
                        <Filter size={18} />
                    </button>
                </div>

                {/* Main Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">No</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Tiket</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Harga</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Kuota</th>
                                <th className="px-6 py-4 text-[9px] font-black text text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Periode Penjualan</th>
                                <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="7" className="px-6 py-8 bg-slate-50/20"></td>
                                    </tr>
                                ))
                            ) : filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                <Ticket size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-black text-slate-900 uppercase tracking-wider">Belum Ada Tiket</p>
                                                <p className="text-slate-400 text-xs font-medium">Klik "Tambah Tiket" untuk mulai menjual!</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTickets.map((ticket, index) => (
                                <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-black text-slate-300">{index + 1}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-[13px] font-medium text-slate-800 tracking-tight">{ticket.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 truncate max-w-[200px] mt-0.5">{ticket.description || 'Tidak ada deskripsi'}</p>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <span className="text-[13px] font-medium text-slate-900">{formatPrice(ticket.price)}</span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="inline-flex flex-col items-center">
                                            <span className="text-xs font-black text-slate-700">{ticket.sold} / {ticket.quota}</span>
                                            <div className="w-20 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                                <div
                                                    className="h-full bg-[#1a36c7] transition-all"
                                                    style={{ width: `${(ticket.sold / ticket.quota) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button
                                            onClick={() => handleToggleStatus(ticket.id, ticket.status)}
                                            className={`
                                                relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200
                                                ${ticket.status === 'active' ? 'bg-[#1a36c7]' : 'bg-slate-200'}
                                            `}
                                        >
                                            <span
                                                className={`
                                                    inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200
                                                    ${ticket.status === 'active' ? 'translate-x-6' : 'translate-x-1'}
                                                `}
                                            />
                                        </button>
                                        <p className={`text-[9px] font-black uppercase tracking-tighter mt-1 ${ticket.status === 'active' ? 'text-[#1a36c7]' : 'text-slate-400'}`}>
                                            {ticket.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase">Mulai:</span>
                                                <span className="text-[10px] font-bold text-slate-700">{ticket.start_date || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase">Selesai:</span>
                                                <span className="text-[10px] font-bold text-slate-700">{ticket.end_date || '-'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all mx-auto">
                                            <MoreVertical size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-[#1a36c7]"></div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Total {tickets.length} Kategori</span>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default TicketCategories;
