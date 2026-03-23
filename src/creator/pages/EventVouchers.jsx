import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    Search,
    Plus,
    MoreVertical,
    Trash2,
    Tag,
    Activity,
    Calendar,
    Filter
} from 'lucide-react';
import AddVoucherModal from '../components/AddVoucherModal';

const EventVouchers = () => {
    const { id: eventId } = useParams();
    const navigate = useNavigate();
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchVouchers = async () => {
        try {
            const { data, error } = await supabase
                .from('vouchers')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVouchers(data);
        } catch (error) {
            console.error('Error fetching vouchers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, [eventId]);

    const handleToggleStatus = async (voucherId, currentStatus) => {
        const newStatus = !currentStatus;
        try {
            const { error } = await supabase
                .from('vouchers')
                .update({ is_active: newStatus })
                .eq('id', voucherId);

            if (error) throw error;
            setVouchers(vouchers.map(v =>
                v.id === voucherId ? { ...v, is_active: newStatus } : v
            ));
        } catch (error) {
            alert('Error updating status: ' + error.message);
        }
    };

    const handleDelete = async (voucherId) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus voucher ini?')) return;
        try {
            const { error } = await supabase
                .from('vouchers')
                .delete()
                .eq('id', voucherId);

            if (error) throw error;
            setVouchers(vouchers.filter(v => v.id !== voucherId));
        } catch (error) {
            alert('Error deleting voucher: ' + error.message);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const filteredVouchers = vouchers.filter(v =>
        v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        {
            label: 'Total Voucher',
            value: vouchers.length,
            icon: Tag,
            color: 'bg-blue-50 text-blue-600'
        },
        {
            label: 'Voucher Aktif',
            value: vouchers.filter(v => v.is_active).length,
            icon: Activity,
            color: 'bg-emerald-50 text-emerald-600'
        },
        {
            label: 'Total Penggunaan',
            value: vouchers.reduce((acc, v) => acc + (v.used_count || 0), 0),
            icon: Calendar,
            color: 'bg-purple-50 text-purple-600'
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
                                placeholder="Cari kode voucher..."
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
                                onClick={() => setIsModalOpen(true)}
                                className="h-[60px] pl-5 pr-7 rounded-2xl bg-[#1a36c7] text-white hover:bg-[#1a36c7]/90 transition-all shadow-lg shadow-[#1a36c7]/20 flex items-center justify-center gap-3 group active:scale-95"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:rotate-90 transition-transform">
                                    <Plus size={20} />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest leading-none">Buat Voucher</span>
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
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">No</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kode & Nama</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nilai Diskon</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Penggunaan</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Masa Berlaku</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="7" className="px-6 py-8 bg-slate-50/10"></td>
                                        </tr>
                                    ))
                                ) : filteredVouchers.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-6 max-w-sm mx-auto">
                                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 rotate-12 group hover:rotate-0 transition-transform cursor-pointer">
                                                    <Tag size={40} />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black text-slate-900 uppercase tracking-wider">Belum Ada Voucher</p>
                                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">Berikan diskon spesial untuk menarik lebih banyak penonton ke event Anda!</p>
                                                </div>
                                                <button
                                                    onClick={() => setIsModalOpen(true)}
                                                    className="px-8 py-4 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
                                                >
                                                    Mulai Buat Voucher
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredVouchers.map((voucher, index) => (
                                    <tr
                                        key={voucher.id}
                                        onClick={() => navigate(`/manage/event/${eventId}/vouchers/${voucher.id}/edit`)}
                                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-semibold text-slate-300">{index + 1}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-[13px] font-bold text-[#1a36c7] tracking-tight uppercase group-hover:translate-x-1 transition-transform inline-block">{voucher.code}</p>
                                            <p className="text-[10px] font-medium text-slate-400 truncate max-w-[200px] mt-0.5">{voucher.name || 'Voucher Tanpa Nama'}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-slate-900">
                                                    {voucher.type === 'percentage' ? `${voucher.value}%` : formatPrice(voucher.value)}
                                                </span>
                                                {voucher.min_purchase > 0 && (
                                                    <span className="text-[9px] font-medium text-slate-400 uppercase">Min: {formatPrice(voucher.min_purchase)}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-xs font-semibold text-slate-700">{voucher.used_count} / {voucher.quota || '∞'}</span>
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#1a36c7] transition-all rounded-full"
                                                        style={{ width: voucher.quota ? `${Math.min((voucher.used_count / voucher.quota) * 100, 100)}%` : '0%' }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`text-[10px] px-3.5 py-2 rounded-xl font-black uppercase tracking-widest ${voucher.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {voucher.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-300" />
                                                <span className="text-[11px] font-bold text-slate-700">
                                                    {voucher.end_date ? new Date(voucher.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tanpa Batas'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(voucher.id);
                                                }}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all mx-auto group"
                                            >
                                                <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination/Summary Footer */}
                    <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#1a36c7] animate-pulse"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total {vouchers.length} Voucher Ditemukan</span>
                        </div>
                    </div>
                </div>
            </div>

            <AddVoucherModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                eventId={eventId}
                onRefresh={fetchVouchers}
            />
        </div>
    );
};

export default EventVouchers;
