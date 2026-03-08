import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { HiX } from 'react-icons/hi';
import { Tag, Calendar, Info, CircleDollarSign, Percent } from 'lucide-react';
import useAuthStore from '../../auth/useAuthStore';

const AddVoucherModal = ({ isOpen, onClose, eventId, onRefresh }) => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [voucherData, setVoucherData] = useState({
        code: '',
        name: '',
        description: '',
        type: 'percentage',
        value: '',
        max_discount: '',
        min_purchase: '',
        quota: '',
        start_date: '',
        end_date: '',
    });

    const formatNumber = (num) => {
        if (!num && num !== 0) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const parseNumber = (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/\./g, '');
    };

    const handleNumericChange = (field, val) => {
        const parsed = parseNumber(val);
        if (/^\d*$/.test(parsed)) {
            setVoucherData({ ...voucherData, [field]: parsed });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('vouchers')
                .insert({
                    event_id: eventId,
                    creator_id: user.id,
                    code: voucherData.code.toUpperCase(),
                    name: voucherData.name,
                    description: voucherData.description,
                    type: voucherData.type,
                    value: parseFloat(voucherData.value),
                    max_discount: voucherData.max_discount ? parseFloat(voucherData.max_discount) : null,
                    min_purchase: voucherData.min_purchase ? parseFloat(voucherData.min_purchase) : 0,
                    quota: voucherData.quota ? parseInt(voucherData.quota) : null,
                    start_date: voucherData.start_date || null,
                    end_date: voucherData.end_date || null,
                    is_active: true
                });

            if (error) throw error;

            onRefresh();
            onClose();
            setVoucherData({
                code: '',
                name: '',
                description: '',
                type: 'percentage',
                value: '',
                max_discount: '',
                min_purchase: '',
                quota: '',
                start_date: '',
                end_date: '',
            });
        } catch (error) {
            alert('Error adding voucher: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">Buat <span className="text-[#1a36c7]">Voucher Baru</span></h2>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Konfigurasi Diskon Event</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                        <HiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-2">
                                <Tag size={12} /> Kode Voucher
                            </label>
                            <input
                                required
                                type="text"
                                value={voucherData.code}
                                onChange={e => setVoucherData({ ...voucherData, code: e.target.value.toUpperCase() })}
                                placeholder="CONTOH: PROMO10"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 font-black text-[#1a36c7] focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm placeholder:font-medium placeholder:text-slate-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Nama Promo</label>
                            <input
                                required
                                type="text"
                                value={voucherData.name}
                                onChange={e => setVoucherData({ ...voucherData, name: e.target.value })}
                                placeholder="Contoh: Diskon Awal Tahun"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm"
                            />
                        </div>
                    </div>

                    {/* Value */}
                    <div className="bg-slate-50 rounded-2xl p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    Nilai Potongan (Rp)
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formatNumber(voucherData.value)}
                                    onChange={e => {
                                        setVoucherData({ ...voucherData, type: 'fixed' });
                                        handleNumericChange('value', e.target.value);
                                    }}
                                    placeholder="50.000"
                                    className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 outline-none text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Conditions */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-2">
                                <CircleDollarSign size={12} /> Min. Pembelian
                            </label>
                            <input
                                type="text"
                                value={formatNumber(voucherData.min_purchase)}
                                onChange={e => handleNumericChange('min_purchase', e.target.value)}
                                placeholder="Contoh: 100.000"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-2">
                                <Info size={12} /> Kuota Penggunaan
                            </label>
                            <input
                                type="text"
                                value={formatNumber(voucherData.quota)}
                                onChange={e => handleNumericChange('quota', e.target.value)}
                                placeholder="Tanpa batas"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm"
                            />
                        </div>
                    </div>

                    {/* Sales Period */}
                    <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-600 pl-1 flex items-center gap-2">
                            <Calendar size={12} /> Periode Berlaku
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Mulai</label>
                                <input
                                    type="date"
                                    value={voucherData.start_date}
                                    onChange={e => setVoucherData({ ...voucherData, start_date: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-900 focus:border-[#1a36c7] outline-none text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Berakhir</label>
                                <input
                                    type="date"
                                    value={voucherData.end_date}
                                    onChange={e => setVoucherData({ ...voucherData, end_date: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-900 focus:border-[#1a36c7] outline-none text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 pb-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1a36c7] text-white py-4 rounded-2xl font-bold hover:bg-[#152ba3] transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Membuat Voucher...' : 'Simpan Voucher'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddVoucherModal;
