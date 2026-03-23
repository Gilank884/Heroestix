import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Ticket, Calendar, Info, CircleDollarSign, ArrowLeft } from 'lucide-react';

const TicketDetail = () => {
    const { id: eventId, ticketId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [taxValue, setTaxValue] = useState(0);
    const [originalSold, setOriginalSold] = useState(0);
    const [ticketData, setTicketData] = useState({
        name: '',
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
        const fetchInitialData = async () => {
            setFetching(true);
            try {
                // 1. Fetch Tax
                const { data: taxData } = await supabase
                    .from('event_taxes')
                    .select('value')
                    .eq('event_id', eventId)
                    .maybeSingle();

                if (taxData) {
                    setTaxValue(parseFloat(taxData.value) || 0);
                }

                // 2. Fetch Ticket Details
                if (!ticketId) return;
                const { data: ticket, error } = await supabase
                    .from('ticket_types')
                    .select('*')
                    .eq('id', ticketId)
                    .eq('event_id', eventId)
                    .single();

                if (error) throw error;
                if (ticket) {
                    setOriginalSold(ticket.sold || 0);
                    setTicketData({
                        name: ticket.name || '',
                        price_net: ticket.price_net?.toString() || '',
                        price_gross: ticket.price_gross?.toString() || '',
                        quota: ticket.quota?.toString() || '',
                        description: ticket.description || '',
                        start_date: ticket.start_date || '',
                        end_date: ticket.end_date || '',
                    });
                }

            } catch (error) {
                console.error("Error fetching data:", error);
                alert("Gagal memuat detail tiket.");
                navigate(`/manage/event/${eventId}/ticket-categories`);
            } finally {
                setFetching(false);
            }
        };

        if (eventId && ticketId) {
            fetchInitialData();
        }
    }, [eventId, ticketId, navigate]);

    const calculateNet = (gross) => {
        const val = parseInt(gross) || 0;
        if (val === 0) return '';
        const net = Math.round(val * (1 + taxValue / 100));
        return net.toString();
    };


    const handlePriceGrossChange = (val) => {
        handlePriceChange(val);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation for quota
        const intQuota = parseInt(ticketData.quota) || 0;
        if (intQuota < originalSold) {
            alert(`Kuota tidak boleh kurang dari jumlah tiket yang sudah terjual (${originalSold}).`);
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('ticket_types')
                .update({
                    name: ticketData.name,
                    price: parseInt(ticketData.price_gross), // Price matches gross usually
                    price_net: parseInt(ticketData.price_net),
                    price_gross: parseInt(ticketData.price_gross),
                    quota: intQuota,
                    description: ticketData.description,
                    start_date: ticketData.start_date || null,
                    end_date: ticketData.end_date || null,
                })
                .eq('id', ticketId)
                .eq('event_id', eventId);

            if (error) throw error;

            navigate(`/manage/event/${eventId}/ticket-categories`);
        } catch (error) {
            alert('Error updating ticket: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Memuat Detail Tiket...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Main Content Area */}
                <div className="lg:col-span-9 order-2 lg:order-1 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                Kuota Tiket {originalSold > 0 && `(Terjual: ${originalSold})`}
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
                            <div className="bg-slate-50 rounded-2xl p-6 space-y-6">
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
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 pl-1">Note</label>
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
                                            Simpan Perubahan
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Sidebar */}
                <aside className="lg:col-span-3 order-1 lg:order-2 space-y-6 lg:sticky lg:top-6">
                    {/* Header Info Card */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="relative z-10 space-y-5">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/manage/event/${eventId}/ticket-categories`)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all group shrink-0"
                                >
                                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                </button>
                                <div>
                                    <h5 className="text-base font-black text-slate-900 tracking-tight leading-tight">Edit Tiket</h5>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Pengaturan Tambahan</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Anda dapat mengubah detail tiket yang sudah ada seperti nama, harga, dan kuota.
                                </p>
                                <p className="text-xs text-red-500 font-medium leading-relaxed">
                                    Catatan: Kuota tidak dapat diubah menjadi lebih kecil dari jumlah yang sudah terjual.
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default TicketDetail;
