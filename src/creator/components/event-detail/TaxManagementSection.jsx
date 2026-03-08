import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Info, Save, CheckCircle2 } from 'lucide-react';
import Toast from '../../../components/ui/Toast';

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
            const payload = {
                event_id: eventId,
                name: taxData.name,
                value: parseFloat(taxData.value) || 0,
                is_included: taxData.is_included,
                type: 'percentage'
            };

            let error;
            if (taxData.id) {
                // Update
                const { error: updateError } = await supabase
                    .from('event_taxes')
                    .update(payload)
                    .eq('id', taxData.id);
                error = updateError;
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('event_taxes')
                    .insert(payload);
                error = insertError;
            }

            if (error) throw error;

            setShowToast(true);
        } catch (error) {
            alert('Gagal menyimpan perubahan: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                <p className="text-gray-400 font-bold">Memuat data pajak...</p>
            </div>
        );
    }

    const subtotalSimulation = 100000;
    const taxSimulation = (parseFloat(taxData.value) || 0) * (subtotalSimulation / 100);
    const totalSimulation = subtotalSimulation + taxSimulation;

    return (
        <div className="space-y-8 max-w-4xl">
            <Toast
                show={showToast}
                message="Perubahan pajak hiburan berhasil disimpan!"
                onClose={() => setShowToast(false)}
            />

            {/* Form Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Konfigurasi Pajak</h3>
                </div>

                <div className="p-6 space-y-8">
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                            <Info className="text-[#1a36c7]" size={20} />
                        </div>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                            Pajak hiburan akan dihitung secara otomatis pada saat checkout berdasarkan subtotal tiket.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Nama Pajak</label>
                            <input
                                type="text"
                                value={taxData.name}
                                onChange={e => setTaxData({ ...taxData, name: e.target.value })}
                                placeholder="Contoh: Pajak Hiburan"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Persentase (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={taxData.value}
                                    onChange={e => setTaxData({ ...taxData, value: e.target.value })}
                                    placeholder="0"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all text-xl"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">%</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-[#1a36c7] text-white py-4 rounded-2xl font-bold hover:bg-[#152ba3] transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </div>

            {/* Simulation Section - Stacked Below */}
            <div className="space-y-4">
                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Simulasi Tampilan Checkout</h4>
                <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Info size={40} />
                    </div>

                    <h5 className="text-lg font-black text-white mb-6">Rincian Pembayaran</h5>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400">Subtotal (1x Tiket)</span>
                            <span className="text-xs font-black text-white">Rp {subtotalSimulation.toLocaleString('id-ID')}</span>
                        </div>

                        {parseFloat(taxData.value) > 0 && (
                            <div className="flex items-center justify-between py-4 border-y border-white/5">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-white">{taxData.name} ({taxData.value}%)</span>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Entertainment Tax</p>
                                </div>
                                <span className="text-xs font-black text-white">
                                    Rp {taxSimulation.toLocaleString('id-ID')}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-black text-white">Total</span>
                            <div className="text-right">
                                <span className="text-2xl font-black text-blue-400">
                                    Rp {totalSimulation.toLocaleString('id-ID')}
                                </span>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Estimasi Total Harga Tiket</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxManagementSection;
