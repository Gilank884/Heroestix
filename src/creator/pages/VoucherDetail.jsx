import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Ticket, Calendar, Info, CircleDollarSign, ArrowLeft, Percent, Hash } from 'lucide-react';

const VoucherDetail = () => {
    const { id: eventId, voucherId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [voucherData, setVoucherData] = useState({
        code: '',
        name: '',
        type: 'fixed',
        value: '',
        min_purchase: '',
        quota: '',
        start_date: '',
        end_date: '',
        is_active: true
    });

    const formatNumber = (num) => {
        if (!num && num !== 0) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const parseNumber = (str) => {
        return str.replace(/\./g, '');
    };

    const handleNumberChange = (field, val) => {
        const parsed = parseNumber(val);
        if (/^\d*$/.test(parsed)) {
            setVoucherData({ ...voucherData, [field]: parsed });
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            setFetching(true);
            try {
                if (!voucherId) return;
                const { data: voucher, error } = await supabase
                    .from('vouchers')
                    .select('*')
                    .eq('id', voucherId)
                    .eq('event_id', eventId)
                    .single();

                if (error) throw error;
                if (voucher) {
                    setVoucherData({
                        code: voucher.code || '',
                        name: voucher.name || '',
                        type: voucher.type || 'fixed',
                        value: voucher.value?.toString() || '',
                        min_purchase: voucher.min_purchase?.toString() || '',
                        quota: voucher.quota?.toString() || '',
                        start_date: voucher.start_date ? voucher.start_date.split('T')[0] : '',
                        end_date: voucher.end_date ? voucher.end_date.split('T')[0] : '',
                        is_active: voucher.is_active
                    });
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                alert("Gagal memuat detail voucher.");
                navigate(`/manage/event/${eventId}/vouchers`);
            } finally {
                setFetching(false);
            }
        };

        if (eventId && voucherId) {
            fetchInitialData();
        }
    }, [eventId, voucherId, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (voucherData.type === 'percentage' && parseInt(voucherData.value) > 100) {
            alert('Nilai potongan persentase tidak boleh lebih dari 100%');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('vouchers')
                .update({
                    code: voucherData.code.toUpperCase(),
                    name: voucherData.name,
                    type: voucherData.type,
                    value: parseInt(voucherData.value),
                    min_purchase: voucherData.min_purchase ? parseInt(voucherData.min_purchase) : 0,
                    quota: voucherData.quota ? parseInt(voucherData.quota) : null,
                    start_date: voucherData.start_date || null,
                    end_date: voucherData.end_date || null,
                    is_active: voucherData.is_active
                })
                .eq('id', voucherId)
                .eq('event_id', eventId);

            if (error) throw error;

            navigate(`/manage/event/${eventId}/vouchers`);
        } catch (error) {
            alert('Error updating voucher: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Memuat Detail Voucher...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-9 order-2 lg:order-1 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <Info size={16} className="text-slate-400" /> Informasi Dasar
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-1">
                                                Kode Voucher
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                value={voucherData.code}
                                                onChange={e => setVoucherData({ ...voucherData, code: e.target.value.toUpperCase() })}
                                                placeholder="Contoh: MERDEKA20"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-900 uppercase focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm placeholder:font-medium placeholder:text-slate-300"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-1">
                                                Nama Voucher (Opsional)
                                            </label>
                                            <input
                                                type="text"
                                                value={voucherData.name}
                                                onChange={e => setVoucherData({ ...voucherData, name: e.target.value })}
                                                placeholder="Contoh: Promo Kemerdekaan"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm placeholder:font-medium placeholder:text-slate-300"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-1">
                                                Kuota (Opsional)
                                            </label>
                                            <input
                                                type="text"
                                                value={formatNumber(voucherData.quota)}
                                                onChange={e => handleNumberChange('quota', e.target.value)}
                                                placeholder="Kosongkan jika tanpa batas"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm placeholder:font-medium placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <CircleDollarSign size={16} className="text-slate-400" /> Nilai & Syarat
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-1">
                                                Nilai Potongan
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                                                    Rp
                                                </span>
                                                <input
                                                    required
                                                    type="text"
                                                    value={formatNumber(voucherData.value)}
                                                    onChange={e => handleNumberChange('value', e.target.value)}
                                                    placeholder="0"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm placeholder:font-medium placeholder:text-slate-300"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-1">
                                                Minimal Pembelian (Opsional)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                                                <input
                                                    type="text"
                                                    value={formatNumber(voucherData.min_purchase)}
                                                    onChange={e => handleNumberChange('min_purchase', e.target.value)}
                                                    placeholder="0"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm placeholder:font-medium placeholder:text-slate-300"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-400" /> Masa Berlaku
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-1">Waktu Mulai</label>
                                        <input
                                            type="date"
                                            value={voucherData.start_date}
                                            onChange={e => setVoucherData({ ...voucherData, start_date: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-1">Waktu Berakhir</label>
                                        <input
                                            type="date"
                                            value={voucherData.end_date}
                                            onChange={e => setVoucherData({ ...voucherData, end_date: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={voucherData.is_active}
                                    onChange={(e) => setVoucherData({ ...voucherData, is_active: e.target.checked })}
                                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-sm font-bold text-slate-900 cursor-pointer">
                                    Voucher Aktif
                                </label>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/manage/event/${eventId}/vouchers`)}
                                    className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-900 transition-all text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-10 py-4 rounded-2xl bg-[#1a36c7] text-white font-bold hover:bg-[#152ba3] transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2 text-sm"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Ticket size={18} />
                                            Simpan Perubahan
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <aside className="lg:col-span-3 order-1 lg:order-2 space-y-6 lg:sticky lg:top-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="relative z-10 space-y-5">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/manage/event/${eventId}/vouchers`)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all group shrink-0"
                                >
                                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                </button>
                                <div>
                                    <h5 className="text-base font-black text-slate-900 tracking-tight leading-tight">Edit Voucher</h5>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Pengaturan Voucher</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Anda dapat mengubah detail voucher seperti kode, nominal diskon, dan batas penggunaannya.
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default VoucherDetail;
