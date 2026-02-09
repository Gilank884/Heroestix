import React from 'react';
import { ChevronDown, MapPin, Map } from 'lucide-react';

const DateTimeLocationSection = ({ eventData, setEventData, INDONESIA_REGIONS }) => {
    return (
        <div className="pt-10 border-t border-slate-100 space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Pengaturan Waktu & Lokasi</h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#1a36c7] rounded-lg text-[9px] font-black uppercase tracking-wider border border-blue-100">
                    WIB (GMT+7)
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Tipe Waktu</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu (Jam)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {/* Mulai */}
                        <tr>
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-xs font-bold text-slate-900">Waktu Mulai</span>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <input
                                    type="date"
                                    value={eventData.event_date}
                                    onChange={e => setEventData({ ...eventData, event_date: e.target.value })}
                                    className="bg-transparent border-0 font-medium text-slate-900 text-sm focus:outline-none focus:ring-0 w-full"
                                />
                            </td>
                            <td className="px-6 py-5">
                                <input
                                    type="time"
                                    value={eventData.event_time}
                                    onChange={e => setEventData({ ...eventData, event_time: e.target.value })}
                                    className="bg-transparent border-0 font-medium text-slate-900 text-sm focus:outline-none focus:ring-0 w-full"
                                />
                            </td>
                        </tr>
                        {/* Berakhir */}
                        <tr>
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-xs font-bold text-slate-900">Waktu Berakhir</span>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <input
                                    type="date"
                                    value={eventData.event_end_date}
                                    onChange={e => setEventData({ ...eventData, event_end_date: e.target.value })}
                                    className="bg-transparent border-0 font-medium text-slate-900 text-sm focus:outline-none focus:ring-0 w-full"
                                />
                            </td>
                            <td className="px-6 py-5">
                                <input
                                    type="time"
                                    value={eventData.event_end_time}
                                    onChange={e => setEventData({ ...eventData, event_end_time: e.target.value })}
                                    className="bg-transparent border-0 font-medium text-slate-900 text-sm focus:outline-none focus:ring-0 w-full"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Provinsi</label>
                    <div className="relative">
                        <Map className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <select
                            value={eventData.province}
                            onChange={e => setEventData({ ...eventData, province: e.target.value, regency: '' })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-12 py-5 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 appearance-none"
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
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Kota / Kabupaten</label>
                    <div className="relative">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <select
                            value={eventData.regency}
                            onChange={e => setEventData({ ...eventData, regency: e.target.value })}
                            disabled={!eventData.province}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-12 py-5 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 appearance-none disabled:opacity-50"
                        >
                            <option value="">Pilih Kota / Kabupaten</option>
                            {eventData.province && INDONESIA_REGIONS.find(r => r.province === eventData.province)?.cities.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Alamat Lengkap</label>
                <textarea
                    value={eventData.detail_address}
                    onChange={e => setEventData({ ...eventData, detail_address: e.target.value })}
                    placeholder="Nama gedung, nama jalan, nomor, dll."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all resize-none"
                />
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Google Maps Link</label>
                    <span className="text-[9px] font-black text-slate-300 uppercase italic">Opsional</span>
                </div>
                <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#1a36c7]">
                        <MapPin size={16} />
                    </div>
                    <input
                        type="url"
                        value={eventData.gmaps_link}
                        onChange={e => setEventData({ ...eventData, gmaps_link: e.target.value })}
                        placeholder="https://maps.app.goo.gl/..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-18 pr-8 py-5 font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 transition-all"
                    />
                </div>
            </div>
        </div>
    );
};

export default DateTimeLocationSection;
