import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { HiX } from 'react-icons/hi';
import { Ticket, Calendar, Info, CircleDollarSign } from 'lucide-react';

const AddTicketModal = ({ isOpen, onClose, eventId, onRefresh }) => {
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

    const handleGrossChange = (val) => {
        setTicketData({
            ...ticketData,
            price_gross: val,
            price_net: calculateNet(val)
        });
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

            onRefresh();
            onClose();
            setTicketData({
                name: '',
                price: '',
                price_net: '',
                price_gross: '',
                quota: '',
                description: '',
                start_date: '',
                end_date: '',
            });
        } catch (error) {
            alert('Error adding ticket: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Tambah <span className="text-[#1a36c7]">Kategori Tiket</span></h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Konfigurasi Penjualan Tiket</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                        <HiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-2">
                                <Ticket size={12} /> Nama Tiket
                            </label>
                            <input
                                required
                                type="text"
                                value={ticketData.name}
                                onChange={e => setTicketData({ ...ticketData, name: e.target.value })}
                                placeholder="Contoh: Presale 1 - Early Bird"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-2">
                                <CircleDollarSign size={12} /> Harga Tiket
                            </label>
                            <input
                                required
                                type="number"
                                value={ticketData.price_gross}
                                onChange={e => handleGrossChange(e.target.value)}
                                placeholder="Contoh: 150000"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-2">
                                <Info size={12} /> Kuota
                            </label>
                            <input
                                required
                                type="number"
                                value={ticketData.quota}
                                onChange={e => setTicketData({ ...ticketData, quota: e.target.value })}
                                placeholder="Contoh: 500"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all"
                            />
                        </div>
                    </div>

                    {/* Sales Period */}
                    <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-600 pl-1 flex items-center gap-2">
                            <Calendar size={12} /> Periode Penjualan
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Mulai</label>
                                <input
                                    type="date"
                                    value={ticketData.start_date}
                                    onChange={e => setTicketData({ ...ticketData, start_date: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-900 focus:border-[#1a36c7] outline-none text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Berakhir</label>
                                <input
                                    type="date"
                                    value={ticketData.end_date}
                                    onChange={e => setTicketData({ ...ticketData, end_date: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-900 focus:border-[#1a36c7] outline-none text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Deskripsi / Benefit</label>
                        <textarea
                            rows="3"
                            value={ticketData.description}
                            onChange={e => setTicketData({ ...ticketData, description: e.target.value })}
                            placeholder="Contoh: Termasuk lunch box dan sertifikat"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/10 focus:border-[#1a36c7] transition-all resize-none font-medium"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1a36c7] text-white py-4 rounded-2xl font-bold hover:bg-[#152ba3] transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Kategori Tiket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTicketModal;
