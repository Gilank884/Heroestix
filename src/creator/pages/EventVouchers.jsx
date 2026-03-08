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
                                    placeholder="Cari kode voucher..."
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
                                            <td colSpan="7" className="px-6 py-16 text-center">
                                                <div className="flex flex-col items-center gap-5">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                        <Tag size={32} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-lg font-black text-slate-900 uppercase tracking-wider">Belum Ada Voucher</p>
                                                        <p className="text-slate-400 text-sm font-medium">Klik "Buat Voucher" untuk memberikan diskon!</p>
                                                    </div>
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
                                                <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest ${voucher.is_active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {voucher.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
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
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(voucher.id);
                                                    }}
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

                        {/* Pagination/Summary Footer */}
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total {vouchers.length} Voucher Ditemukan</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Sidebar */}
                <aside className="lg:col-span-3 order-1 lg:order-2 space-y-6 lg:sticky lg:top-6">
                    {/* Action Card */}
                    <div className="space-y-4">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2.5 text-[#1a36c7] py-3.5 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all active:scale-95 group border border-slate-200 bg-white"
                        >
                            <span className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <Plus size={16} />
                            </span>
                            Buat Voucher Baru
                        </button>
                    </div>

                    {/* Tutorial Card */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="relative z-10 space-y-5">
                            <h5 className="text-base font-black text-slate-900 tracking-tight border-b border-slate-100 pb-3">Daftar Istilah Status</h5>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1a36c7] flex items-center justify-center font-black text-xs shrink-0 pt-0.5">A</div>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1"><span className="font-bold text-slate-900">Aktif</span> - Voucher bisa dipakai oleh pelanggan.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1a36c7] flex items-center justify-center font-black text-xs shrink-0 pt-0.5">N</div>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1"><span className="font-bold text-slate-900">Nonaktif</span> - Voucher dihentikan pemakaiannya.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
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
