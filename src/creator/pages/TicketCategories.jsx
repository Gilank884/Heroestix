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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Main Content Area */}
                <div className="lg:col-span-9 order-2 lg:order-1 space-y-6">
                    {/* Search & Filter Header */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
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
                                            <td colSpan="3" className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-5">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                        <Ticket size={32} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-lg font-black text-slate-900 uppercase tracking-wider">Belum Ada Tiket</p>
                                                        <p className="text-slate-400 text-sm font-medium">Kategori tiket yang Anda cari tidak ditemukan.</p>
                                                    </div>
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
                                            <td className="px-6 py-5 text-right">
                                                <span className="text-sm font-black text-[#1a36c7] bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">{formatPrice(ticket.price)}</span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest ${ticket.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {ticket.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                                </span>
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
                <aside className="lg:col-span-3 order-1 lg:order-2 space-y-6 lg:sticky lg:top-6">
                    {/* Action Card */}
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('create')}
                            className="w-full flex items-center justify-center gap-2.5 text-[#1a36c7] py-3.5 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all active:scale-95 group border border-slate-200 bg-white"
                        >
                            <span className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <Plus size={16} />
                            </span>
                            Tambah Tiket Baru
                        </button>
                    </div>

                    {/* Tutorial Card */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="relative z-10 space-y-5">
                            <h5 className="text-base font-black text-slate-900 tracking-tight border-b border-slate-100 pb-3">Alur Pembuatan Ticket</h5>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1a36c7] flex items-center justify-center font-black text-xs shrink-0 pt-0.5">1</div>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1">Klik tombol <span className="font-bold text-slate-900">Tambah Tiket Baru</span>.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1a36c7] flex items-center justify-center font-black text-xs shrink-0 pt-0.5">2</div>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1">Isi detail nama, harga (IDR), dan kuota tiket.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1a36c7] flex items-center justify-center font-black text-xs shrink-0 pt-0.5">3</div>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1">Atur jadwal inisialisasi & terminasi sales.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1a36c7] flex items-center justify-center font-black text-xs shrink-0 pt-0.5">4</div>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1">Simpan untuk memuat ke daftar penjualan.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default TicketCategories;
