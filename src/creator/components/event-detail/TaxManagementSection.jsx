import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Info, Save, CheckCircle2, Percent, Calculator } from 'lucide-react';
import Toast from '../../../components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const TaxManagementSection = ({ eventId }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [taxData, setTaxData] = useState({
        id: null,
        name: 'Pajak Hiburan',
        value: '0',
        is_included: false
    });

    useEffect(() => {
        const fetchTax = async () => {
            if (!eventId) return;
            try {
                const { data, error } = await supabase
                    .from('event_taxes')
                    .select('*')
                    .eq('event_id', eventId)
                    .maybeSingle();

                if (data) {
                    setTaxData({
                        id: data.id,
                        name: data.name || 'Pajak Hiburan',
                        value: data.value?.toString() || '0',
                        is_included: data.is_included || false
                    });
                }
            } catch (error) {
                console.error('Error fetching tax:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTax();
    }, [eventId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const taxPayload = {
                event_id: eventId,
                name: taxData.name,
                value: parseFloat(taxData.value) || 0,
                is_included: taxData.is_included,
                type: 'percentage'
            };

            const { error } = taxData.id
                ? await supabase.from('event_taxes').update(taxPayload).eq('id', taxData.id)
                : await supabase.from('event_taxes').insert(taxPayload);

            if (error) throw error;
            setShowToast(true);
        } catch (error) {
            alert('Gagal menyimpan pajak: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const simulationBase = 100000;
    const taxRate = (parseFloat(taxData.value) || 0) / 100;
    const taxAmount = simulationBase * taxRate;
    const totalWithTax = taxData.is_included ? simulationBase : simulationBase + taxAmount;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-12"
        >
            <Toast
                show={showToast}
                message="Konfigurasi pajak berhasil diperbarui!"
                onClose={() => setShowToast(false)}
            />

            <div className="space-y-12">
                {/* Tax Configuration */}
                <div className="space-y-8">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Economic Parameter • Konfigurasi Pajak</label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nama Pajak</label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-focus-within:text-blue-600 group-focus-within:border-blue-100 transition-colors">
                                        <Info size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        value={taxData.name}
                                        onChange={e => setTaxData({ ...taxData, name: e.target.value })}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-20 pr-8 py-5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-100 transition-all text-sm"
                                        placeholder="Contoh: Pajak Hiburan"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Persentase Pajak (%)</label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-focus-within:text-blue-600 group-focus-within:border-blue-100 transition-colors">
                                        <Percent size={16} />
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={taxData.value}
                                        onChange={e => setTaxData({ ...taxData, value: e.target.value })}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-20 pr-8 py-5 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-100 transition-all text-sm tabular-nums"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Metode Pajak</label>
                            <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-4 flex gap-2">
                                <button
                                    onClick={() => setTaxData({ ...taxData, is_included: true })}
                                    className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${taxData.is_included ? 'bg-white shadow-xl shadow-slate-200/50 text-blue-600 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Pajak Termasuk
                                </button>
                                <button
                                    onClick={() => setTaxData({ ...taxData, is_included: false })}
                                    className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${!taxData.is_included ? 'bg-white shadow-xl shadow-slate-200/50 text-blue-600 border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Pajak Luar
                                </button>
                            </div>
                            <div className="px-6 py-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl flex items-start gap-3">
                                <Info size={14} className="text-blue-600 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                    {taxData.is_included 
                                        ? "Pajak dipotong langsung dari harga tiket yang Anda tentukan. Pembeli membayar sesuai harga tiket."
                                        : "Pajak ditambahkan ke atas harga tiket. Pembeli akan membayar Harga Tiket + Pajak."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Simulation Area */}
                <div className="space-y-6 pt-4 border-t border-slate-100/50">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Revenue Forecast • Simulasi Harga</label>
                    <div className="bg-white/50 border border-slate-100 rounded-[3rem] p-10 overflow-hidden relative group shadow-sm">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700" />
                        
                        <div className="relative z-10 max-w-xl mx-auto">
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 justify-center">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
                                        <Calculator size={20} />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Simulasi Penjualan</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Contoh Harga Tiket Rp 100.000</p>
                                    </div>
                                </div>

                                <div className="space-y-4 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Harga Dasar</span>
                                        <span className="text-sm font-black text-slate-900 tabular-nums">Rp 100.000</span>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{taxData.name} ({taxData.value}%)</span>
                                        <span className="text-sm font-black text-blue-600 tabular-nums">
                                            {taxData.is_included ? '-' : '+'} Rp {taxAmount.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="pt-6 border-t border-dashed border-slate-200 flex justify-between items-center px-2">
                                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Total Bayar Pembeli</span>
                                        <span className="text-2xl font-black text-slate-900 tabular-nums uppercase">
                                            Rp {totalWithTax.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 group">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-600 transition-all shadow-2xl shadow-slate-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 relative overflow-hidden"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 shadow-inner group-hover:bg-white animate-glow group-hover:text-blue-600 transition-colors">
                                    <Save size={14} />
                                </div>
                                <span className="relative z-10">Simpan Konfigurasi Pajak</span>
                            </div>
                        )}
                    </button>
                    <p className="text-center mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-3">
                        <CheckCircle2 size={12} className="text-blue-600" /> Fiscal data integrity verified and ready for sync
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default TaxManagementSection;
