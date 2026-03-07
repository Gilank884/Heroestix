import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { ChevronDown, MapPin, Map, Info, Save, CheckCircle2 } from 'lucide-react';
import { INDONESIA_REGIONS } from '../../../constants/locations';
import Toast from '../../../components/ui/Toast';

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
            // Helper to parse location fallback (e.g. "Detail Address, Regency, Province")
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
            // Consolidate location for display elsewhere if needed
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
                    location: consolidatedLocation || formData.location, // We use consolidated as venue+address fallback
                    provinsi: province,
                    kabupaten: regency
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
        <div className="space-y-8">
            <Toast
                show={showToast}
                message="Jadwal & lokasi event berhasil diperbarui!"
                onClose={() => setShowToast(false)}
            />

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900">Pengaturan Waktu & Lokasi</h3>
                </div>

                <div className="p-8 space-y-8">
                    {/* Waktu Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Waktu Penyelenggaraan</h4>
                            <div className="px-3 py-1 bg-blue-50 text-[#1a36c7] rounded-lg text-[9px] font-black uppercase tracking-wider border border-blue-100">
                                WIB (GMT+7)
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/4">Tipe Waktu</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Waktu (Jam)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                <span className="text-xs font-bold text-slate-900">Mulai</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="date"
                                                value={formData.event_date}
                                                onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                                                className="bg-transparent border-0 font-bold text-slate-900 text-xs focus:outline-none focus:ring-0 w-full p-0"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="time"
                                                value={formData.event_time}
                                                onChange={e => setFormData({ ...formData, event_time: e.target.value })}
                                                className="bg-transparent border-0 font-bold text-slate-900 text-xs focus:outline-none focus:ring-0 w-full p-0"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                <span className="text-xs font-bold text-slate-900">Berakhir</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="date"
                                                value={formData.event_end_date}
                                                onChange={e => setFormData({ ...formData, event_end_date: e.target.value })}
                                                className="bg-transparent border-0 font-bold text-slate-900 text-xs focus:outline-none focus:ring-0 w-full p-0"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="time"
                                                value={formData.event_end_time}
                                                onChange={e => setFormData({ ...formData, event_end_time: e.target.value })}
                                                className="bg-transparent border-0 font-bold text-slate-900 text-xs focus:outline-none focus:ring-0 w-full p-0"
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Lokasi Section */}
                    <div className="space-y-6 pt-4 border-t border-slate-50">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Informasi Lokasi</h4>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nama Venue</label>
                            <div className="relative">
                                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Contoh: Gedung Serbaguna Utama"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Provinsi</label>
                                <div className="relative">
                                    <Map className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <select
                                        value={formData.province}
                                        onChange={e => setFormData({ ...formData, province: e.target.value, regency: '' })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-12 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 appearance-none"
                                    >
                                        <option value="">Pilih Provinsi</option>
                                        {INDONESIA_REGIONS.map(region => (
                                            <option key={region.province} value={region.province}>{region.province}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Kota / Kabupaten</label>
                                <div className="relative">
                                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <select
                                        value={formData.regency}
                                        onChange={e => setFormData({ ...formData, regency: e.target.value })}
                                        disabled={!formData.province}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-12 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 appearance-none disabled:opacity-50"
                                    >
                                        <option value="">Pilih Kota / Kabupaten</option>
                                        {formData.province && INDONESIA_REGIONS.find(r => r.province === formData.province)?.cities.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Alamat Lengkap</label>
                            <textarea
                                value={formData.detail_address}
                                onChange={e => setFormData({ ...formData, detail_address: e.target.value })}
                                placeholder="Nama gedung, nama jalan, nomor, dll."
                                rows={3}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all resize-none text-sm"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Google Maps Link</label>
                                <span className="text-[9px] font-black text-slate-300 uppercase italic">Opsional</span>
                            </div>
                            <div className="relative">
                                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                                <input
                                    type="url"
                                    value={formData.gmaps_link}
                                    onChange={e => setFormData({ ...formData, gmaps_link: e.target.value })}
                                    placeholder="https://maps.app.goo.gl/..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all text-sm"
                                />
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

export default DateTimeLocationManagement;
