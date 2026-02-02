import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    Info,
    Calendar,
    MapPin,
    Share2,
    Globe,
    Edit,
    Clock,
    CheckCircle2,
    Tag
} from 'lucide-react';
import { getCategoryName, getSubCategoryName } from '../../constants/categories';

const EventDetail = () => {
    const { id: eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Informasi Umum');

    const tabs = [
        "Informasi Umum",
        "Tanggal Dan Lokasi",
        "Pajak Hiburan"
    ];

    useEffect(() => {
        const fetchEvent = async () => {
            if (eventId) {
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', eventId)
                    .single();

                if (!error && data) {
                    setEvent(data);
                }
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    if (loading) return <div className="p-10 text-center font-bold">Loading...</div>;
    if (!event) return <div className="p-10 text-center text-red-500 font-bold">Event not found</div>;

    return (
        <div className="p-8 space-y-6 animate-in fade-in duration-500">
            {/* Page Title */}
            <h1 className="text-2xl font-black text-gray-900">Detail Event</h1>

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-[13px] font-bold transition-all relative
                            ${activeTab === tab ? 'text-[#1a36c7]' : 'text-gray-400 hover:text-gray-600'}
                        `}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1a36c7]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Dynamic Content */}
            <div className="space-y-6">
                {activeTab === 'Informasi Umum' && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 grid grid-cols-[200px_1fr] gap-x-12 gap-y-12">
                            <div className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mt-1">Kategori</div>
                            <div>
                                {event.category ? (
                                    <div className="flex flex-wrap gap-2">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-[#1a36c7] rounded-lg text-[11px] font-black uppercase tracking-wider border border-blue-100 shadow-sm">
                                            <Tag size={12} />
                                            {getCategoryName(event.category)}
                                        </div>
                                        {event.sub_category && (
                                            <div className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold uppercase tracking-wider border border-slate-200">
                                                {getSubCategoryName(event.category, event.sub_category)}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-[11px] font-bold text-slate-400 italic">Belum ditentukan</div>
                                )}
                                <div className="mt-8 space-y-4 text-gray-900">
                                    <h2 className="text-xl font-bold">{event.title}</h2>
                                    <p className="text-sm font-medium text-gray-500">
                                        {event.location}, {new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mt-1">Deskripsi</div>
                            <div className="space-y-6">
                                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {event.description || "Tidak ada deskripsi tersedia untuk event ini."}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Tanggal Dan Lokasi' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 flex items-center justify-between border-b border-gray-50">
                                <h3 className="font-black text-gray-900">Tanggal Dan Lokasi</h3>
                                <button className="flex items-center gap-2 px-4 py-1.5 bg-[#1a36c7] text-white rounded-lg text-xs font-bold hover:bg-[#152ba3] transition-all">
                                    <Edit size={14} />
                                    Edit
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="bg-[#f0f7ff] p-4 rounded-xl border border-[#d0e6ff] flex items-center gap-3 mb-6">
                                    <Info size={18} className="text-[#1a36c7]" />
                                    <span className="text-[11px] font-bold text-[#1a36c7]">Format tanggal dan waktu menggunakan zona waktu WIB (UTC+7)</span>
                                </div>

                                <table className="w-full text-sm border-collapse border border-gray-100 rounded-xl overflow-hidden">
                                    <tbody className="divide-y divide-gray-100">
                                        <tr className="bg-gray-50/30">
                                            <td className="p-4 font-bold text-gray-500 w-1/3 border-r border-gray-100">Tanggal & Waktu</td>
                                            <td className="p-4 font-bold text-gray-900">{new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} @ {event.event_time} WIB</td>
                                        </tr>
                                        <tr>
                                            <td className="p-4 font-bold text-gray-500 border-r border-gray-100">Nama Venue</td>
                                            <td className="p-4 font-bold text-gray-900">{event.location}</td>
                                        </tr>
                                        <tr className="bg-gray-50/30">
                                            <td className="p-4 font-bold text-gray-500 border-r border-gray-100">Alamat Lengkap</td>
                                            <td className="p-4 font-bold text-gray-900 leading-relaxed">{event.location}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Placeholders for other tabs */}
                {activeTab === 'Pajak Hiburan' && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                            <Info size={32} />
                        </div>
                        <h3 className="font-black text-gray-900">{activeTab}</h3>
                        <p className="text-gray-400 text-sm font-bold max-w-sm mx-auto">Informasi terkait {activeTab.toLowerCase()} sedang dalam proses pengembangan.</p>
                        <button className="flex items-center gap-2 px-6 py-2 bg-[#1a36c7] text-white rounded-lg text-xs font-bold hover:bg-[#152ba3] transition-all mx-auto mt-6">
                            <Edit size={14} />
                            Ingatkan Saya
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
};

export default EventDetail;
