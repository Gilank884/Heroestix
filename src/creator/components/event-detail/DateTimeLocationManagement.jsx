import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { ChevronDown, MapPin, Map, Info, Save, CheckCircle2 } from 'lucide-react';
import { INDONESIA_REGIONS } from '../../../constants/locations';
import Toast from '../../../components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const DateTimeLocationManagement = ({ eventId, eventData: initialData, onUpdate }) => {
    const [saving, setSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [formData, setFormData] = useState({
        event_date: '',
        event_time: '',
        event_end_date: '',
        event_end_time: '',
        province: '',
        regency: '',
        detail_address: '',
        gmaps_link: '',
        location: '' // Venue Name
    });

    useEffect(() => {
        if (initialData) {
            const parts = initialData.location?.split(',').map(p => p.trim()) || [];

            setFormData({
                event_date: initialData.event_date || '',
                event_time: initialData.event_time || '',
                event_end_date: initialData.event_end_date || '',
                event_end_time: initialData.event_end_time || '',
                province: initialData.provinsi || parts[parts.length - 1] || '',
                regency: initialData.kabupaten || parts[parts.length - 2] || '',
                detail_address: initialData.detail_address || parts.slice(0, Math.max(0, parts.length - 2)).join(', ') || initialData.location || '',
                gmaps_link: initialData.gmaps_link || '',
                location: initialData.location || '' // Venue Name
            });
        }
    }, [initialData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const consolidatedLocation = `${formData.detail_address || ''}, ${formData.regency || ''}, ${formData.province || ''}`.replace(/^, |, $/g, '').trim();

            const {
                province,
                regency,
                detail_address,
                gmaps_link,
                event_end_date,
                event_end_time,
                ...updateData
            } = formData;

            const { error } = await supabase
                .from('events')
                .update({
                    ...updateData,
                    location: consolidatedLocation || formData.location,
                    provinsi: province,
                    kabupaten: regency,
                    gmaps_link: gmaps_link,
                    event_end_date: event_end_date,
                    event_end_time: event_end_time
                })
                .eq('id', eventId);

            if (error) throw error;

            setShowToast(true);
            if (onUpdate) onUpdate();
        } catch (error) {
            alert('Gagal menyimpan perubahan: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-12"
        >
            <Toast
                show={showToast}
                message="Jadwal & lokasi event berhasil diperbarui!"
                onClose={() => setShowToast(false)}
            />

            <div className="space-y-12">
                {/* Waktu Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timeline Event • Penjadwalan</label>
                        <div className="px-3 py-1 bg-white border border-slate-100 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">
                            WIB (GMT+7)
                        </div>
                    </div>

                    <div className="bg-white/50 border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-1/3">Tipe Waktu</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tanggal</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Waktu (Jam)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr className="group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Mulai</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <input
                                            type="date"
                                            value={formData.event_date}
                                            onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                                            className="bg-slate-100/50 group-hover:bg-white border border-transparent group-hover:border-slate-100 rounded-xl px-4 py-2 font-black text-slate-900 text-xs focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all w-full tabular-nums"
                                        />
                                    </td>
                                    <td className="px-8 py-6">
                                        <input
                                            type="time"
                                            value={formData.event_time}
                                            onChange={e => setFormData({ ...formData, event_time: e.target.value })}
                                            className="bg-slate-100/50 group-hover:bg-white border border-transparent group-hover:border-slate-100 rounded-xl px-4 py-2 font-black text-slate-900 text-xs focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all w-full tabular-nums"
                                        />
                                    </td>
                                </tr>
                                <tr className="group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Berakhir</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <input
                                            type="date"
                                            value={formData.event_end_date}
                                            onChange={e => setFormData({ ...formData, event_end_date: e.target.value })}
                                            className="bg-slate-100/50 group-hover:bg-white border border-transparent group-hover:border-slate-100 rounded-xl px-4 py-2 font-black text-slate-900 text-xs focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all w-full tabular-nums"
                                        />
                                    </td>
                                    <td className="px-8 py-6">
                                        <input
                                            type="time"
                                            value={formData.event_end_time}
                                            onChange={e => setFormData({ ...formData, event_end_time: e.target.value })}
                                            className="bg-slate-100/50 group-hover:bg-white border border-transparent group-hover:border-slate-100 rounded-xl px-4 py-2 font-black text-slate-900 text-xs focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all w-full tabular-nums"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Lokasi Section */}
                <div className="space-y-8 pt-4 border-t border-slate-100/50">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Spatial Configuration • Lokasi & Venue</label>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nama Venue / Gedung</label>
                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-focus-within:text-blue-600 group-focus-within:border-blue-100 transition-colors">
                                <MapPin size={16} />
                            </div>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Contoh: Gedung Serbaguna Utama"
                                className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl pl-20 pr-8 py-5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-100 transition-all text-base"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Provinsi</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-focus-within:text-blue-600 group-focus-within:border-blue-100 transition-colors">
                                    <Map size={16} />
                                </div>
                                <select
                                    value={formData.province}
                                    onChange={e => setFormData({ ...formData, province: e.target.value, regency: '' })}
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-20 pr-12 py-5 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-100 appearance-none text-xs uppercase tracking-widest transition-all cursor-pointer"
                                >
                                    <option value="">Pilih Provinsi</option>
                                    {INDONESIA_REGIONS.map(region => (
                                        <option key={region.province} value={region.province}>{region.province}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Kota / Kabupaten</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-focus-within:text-blue-600 group-focus-within:border-blue-100 transition-colors">
                                    <MapPin size={16} />
                                </div>
                                <select
                                    value={formData.regency}
                                    onChange={e => setFormData({ ...formData, regency: e.target.value })}
                                    disabled={!formData.province}
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-20 pr-12 py-5 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-100 appearance-none disabled:opacity-50 text-xs uppercase tracking-widest transition-all cursor-pointer"
                                >
                                    <option value="">Pilih Kota / Kabupaten</option>
                                    {formData.province && INDONESIA_REGIONS.find(r => r.province === formData.province)?.cities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Alamat Lengkap Detail</label>
                        <textarea
                            value={formData.detail_address}
                            onChange={e => setFormData({ ...formData, detail_address: e.target.value })}
                            placeholder="Sebutkan nama gedung, nama jalan, nomor, lantai, dll."
                            rows={4}
                            className="w-full bg-slate-50/50 border border-slate-100 rounded-[2rem] px-8 py-6 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-100 transition-all resize-none text-[15px] shadow-inner"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Google Maps Integration</label>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic flex items-center gap-1.5">Opsional</span>
                        </div>
                        <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm transition-colors">
                                <MapPin size={16} />
                            </div>
                            <input
                                type="url"
                                value={formData.gmaps_link}
                                onChange={e => setFormData({ ...formData, gmaps_link: e.target.value })}
                                placeholder="https://maps.app.goo.gl/..."
                                className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl pl-20 pr-8 py-5 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-100 transition-all text-sm"
                            />
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
                                <span className="relative z-10">Perbarui Jadwal & Lokasi</span>
                            </div>
                        )}
                    </button>
                    <p className="text-center mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-3">
                        <CheckCircle2 size={12} className="text-blue-600" /> Synchronization successful for real-time location update
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default DateTimeLocationManagement;
