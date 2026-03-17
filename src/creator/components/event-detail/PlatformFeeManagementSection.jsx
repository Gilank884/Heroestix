import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Info, Save, Settings } from 'lucide-react';
import Toast from '../../../components/ui/Toast';

const PlatformFeeManagementSection = ({ eventId }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [platformFeeData, setPlatformFeeData] = useState({
        name: 'Biaya Platform',
        type: 'fixed',
        value: '5000'
    });

    useEffect(() => {
        const fetchEventFees = async () => {
            if (!eventId) return;
            try {
                const { data, error } = await supabase
                    .from('event_platform_fees')
                    .select('name, type, value')
                    .eq('event_id', eventId)
                    .maybeSingle();

                if (data) {
                    setPlatformFeeData({
                        name: data.name || 'Biaya Platform',
                        type: data.type || 'fixed',
                        value: data.value?.toString() || '0'
                    });
                }
            } catch (error) {
                console.error('Error fetching platform fee:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEventFees();
    }, [eventId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                event_id: eventId,
                name: platformFeeData.name,
                type: platformFeeData.type,
                value: parseFloat(platformFeeData.value) || 0
            };

            const { data: existing } = await supabase
                .from('event_platform_fees')
                .select('id')
                .eq('event_id', eventId)
                .maybeSingle();

            let error;
            if (existing) {
                const { error: updateError } = await supabase
                    .from('event_platform_fees')
                    .update(payload)
                    .eq('event_id', eventId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('event_platform_fees')
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
                <p className="text-gray-400 font-bold">Memuat data biaya platform...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl">
            <Toast
                show={showToast}
                message="Perubahan biaya platform berhasil disimpan!"
                onClose={() => setShowToast(false)}
            />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Settings size={18} className="text-[#1a36c7]" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Konfigurasi Biaya Platform</h3>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                            <Info className="text-[#1a36c7]" size={20} />
                        </div>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                            Biaya ini akan dibebankan kepada pembeli pada setiap transaksi. Anda dapat menyesuaikan label dan nominalnya.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Nama Biaya</label>
                            <input
                                type="text"
                                value={platformFeeData.name}
                                onChange={e => setPlatformFeeData({ ...platformFeeData, name: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Tipe Biaya</label>
                                <select
                                    value={platformFeeData.type}
                                    onChange={e => setPlatformFeeData({ ...platformFeeData, type: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all"
                                >
                                    <option value="fixed">Nominal Tetap (Rp)</option>
                                    <option value="percentage">Persentase (%)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">
                                    {platformFeeData.type === 'fixed' ? 'Nominal (Rp)' : 'Nilai (%)'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={platformFeeData.value}
                                        onChange={e => setPlatformFeeData({ ...platformFeeData, value: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all text-xl"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">
                                        {platformFeeData.type === 'fixed' ? 'Rp' : '%'}
                                    </span>
                                </div>
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
        </div>
    );
};

export default PlatformFeeManagementSection;
