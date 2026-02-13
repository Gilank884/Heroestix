import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Ticket, Calendar, Info, CircleDollarSign, ArrowLeft } from 'lucide-react';

const CreateTicket = () => {
    const { id: eventId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [taxValue, setTaxValue] = useState(0);
    const [ticketData, setTicketData] = useState({
        name: '',
        price: '',
        price_net: '',
        price_gross: '',
        quota: '',
        description: '',
        start_date: '',
        end_date: '',
    });

    const formatNumber = (num) => {
        if (!num && num !== 0) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const parseNumber = (str) => {
        return str.replace(/\./g, '');
    };

    const handlePriceChange = (val) => {
        const parsed = parseNumber(val);
        if (/^\d*$/.test(parsed)) {
            setTicketData({
                ...ticketData,
                price_gross: parsed,
                price_net: calculateNet(parsed)
            });
        }
    };

    const handleQuotaChange = (val) => {
        const parsed = parseNumber(val);
        if (/^\d*$/.test(parsed)) {
            setTicketData({ ...ticketData, quota: parsed });
        }
    };

    useEffect(() => {
        const fetchEventTax = async () => {
            if (!eventId) return;
            const { data, error } = await supabase
                .from('event_taxes')
                .select('value')
                .eq('event_id', eventId)
                .maybeSingle();

            if (data) {
                setTaxValue(parseFloat(data.value) || 0);
            }
        };
        fetchEventTax();
    }, [eventId]);

    const calculateNet = (gross) => {
        const val = parseInt(gross) || 0;
        if (val === 0) return '';
        const net = Math.round(val * (1 + taxValue / 100) + 8500);
        return net.toString();
    };

    const handlePriceGrossChange = (val) => {
        handlePriceChange(val);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('ticket_types')
                .insert({
                    ...ticketData,
                    event_id: eventId,
                    price: parseInt(ticketData.price_gross),
                    price_net: parseInt(ticketData.price_net),
                    price_gross: parseInt(ticketData.price_gross),
                    quota: parseInt(ticketData.quota),
                    sold: 0,
                    status: 'active'
                });

            if (error) throw error;

            navigate(`/manage/event/${eventId}/ticket-categories`);
        } catch (error) {
            alert('Error adding ticket: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => navigate(`/manage/event/${eventId}/ticket-categories`)}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors mb-2 text-sm font-medium"
                    >
                        <ArrowLeft size={16} /> Kembali ke Daftar Tiket
                    </button>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        Buat <span className="text-[#1a36c7]">Tiket Baru</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5 text-slate-400">
                        <Ticket size={12} className="text-[#1a36c7]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Konfigurasi Penjualan Tiket</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                                <Info size={16} className="text-slate-400" /> Informasi Dasar
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-1">
                                        Nama Tiket
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={ticketData.name}
                                        onChange={e => setTicketData({ ...ticketData, name: e.target.value })}
                                        placeholder="Contoh: Presale 1 - Early Bird"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm placeholder:font-medium placeholder:text-slate-300"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-1">
                                        Kuota Tiket
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formatNumber(ticketData.quota)}
                                        onChange={e => handleQuotaChange(e.target.value)}
                                        placeholder="Contoh: 500"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm placeholder:font-medium placeholder:text-slate-300"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                                <CircleDollarSign size={16} className="text-slate-400" /> Harga & Pembayaran
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-1">
                                        Harga Tiket
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                                        <input
                                            required
                                            type="text"
                                            value={formatNumber(ticketData.price_gross)}
                                            onChange={e => handlePriceGrossChange(e.target.value)}
                                            placeholder="0"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm placeholder:font-medium placeholder:text-slate-300"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 pl-1">
                                        *Harga yang akan dibayar oleh pembeli
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sales Period */}
                    <div className="bg-slate-50 rounded-3xl p-8 space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" /> Periode Penjualan
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-1">Waktu Mulai</label>
                                <input
                                    type="date"
                                    value={ticketData.start_date}
                                    onChange={e => setTicketData({ ...ticketData, start_date: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-1">Waktu Berakhir</label>
                                <input
                                    type="date"
                                    value={ticketData.end_date}
                                    onChange={e => setTicketData({ ...ticketData, end_date: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-1">Deskripsi / Benefit</label>
                        <textarea
                            rows="4"
                            value={ticketData.description}
                            onChange={e => setTicketData({ ...ticketData, description: e.target.value })}
                            placeholder="Jelaskan keuntungan yang didapat pembeli tiket ini. Contoh: Termasuk lunch box, sertifikat, dan merchandise eksklusif."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all resize-none text-sm placeholder:text-slate-300"
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(`/manage/event/${eventId}/ticket-categories`)}
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
                                    Simpan Tiket
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTicket;
