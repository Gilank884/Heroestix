import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                        Voucher <span className="text-[#1a36c7]">Event</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5 text-slate-400">
                        <Activity size={12} className="text-blue-500" />
                        <span className="text-[10px] font-medium uppercase tracking-widest">Manajemen Promo & Diskon</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-2.5 rounded-xl bg-[#1a36c7] text-white font-semibold text-[11px] uppercase hover:bg-[#152ba3] transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={16} /> Buat Voucher
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
                            placeholder="Cari kode voucher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 focus:border-[#1a36c7] transition-all placeholder:text-slate-300 shadow-sm"
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
                                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">No</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kode & Nama</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nilai Diskon</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Penggunaan</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Masa Berlaku</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="7" className="px-6 py-8 bg-slate-50/20"></td>
                                    </tr>
                                ))
                            ) : filteredVouchers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                <Tag size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900 uppercase tracking-wider">Belum Ada Voucher</p>
                                                <p className="text-slate-400 text-xs font-medium">Klik "Buat Voucher" untuk memberikan diskon!</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredVouchers.map((voucher, index) => (
                                <tr key={voucher.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-semibold text-slate-300">{index + 1}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-[13px] font-bold text-[#1a36c7] tracking-tight uppercase">{voucher.code}</p>
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
                                            <div className="w-20 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                                <div
                                                    className="h-full bg-[#1a36c7] transition-all"
                                                    style={{ width: voucher.quota ? `${(voucher.used_count / voucher.quota) * 100}%` : '0%' }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button
                                            onClick={() => handleToggleStatus(voucher.id, voucher.is_active)}
                                            className={`
                                                relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200
                                                ${voucher.is_active ? 'bg-[#1a36c7]' : 'bg-slate-200'}
                                            `}
                                        >
                                            <span
                                                className={`
                                                    inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200
                                                    ${voucher.is_active ? 'translate-x-6' : 'translate-x-1'}
                                                `}
                                            />
                                        </button>
                                        <p className={`text-[9px] font-bold uppercase tracking-tighter mt-1 ${voucher.is_active ? 'text-[#1a36c7]' : 'text-slate-400'}`}>
                                            {voucher.is_active ? 'Aktif' : 'Nonaktif'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-semibold text-slate-400 uppercase">Hingga:</span>
                                                <span className="text-[10px] font-medium text-slate-700">
                                                    {voucher.end_date ? new Date(voucher.end_date).toLocaleDateString('id-ID') : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button
                                            onClick={() => handleDelete(voucher.id)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all mx-auto"
                                        >
                                            <Trash2 size={16} />
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
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Total {vouchers.length} Voucher</span>
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
