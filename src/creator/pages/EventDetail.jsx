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
    Tag,
    Settings
} from 'lucide-react';
import { getCategoryName, getSubCategoryName } from '../../constants/categories';
import VerificationPending from '../components/VerificationPending';
import TaxManagementSection from '../components/event-detail/TaxManagementSection';
import DateTimeLocationManagement from '../components/event-detail/DateTimeLocationManagement';
import GeneralInfoManagement from '../components/event-detail/GeneralInfoManagement';
import PlatformFeeManagementSection from '../components/event-detail/PlatformFeeManagementSection';

const EventDetail = () => {
    const { id: eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isVerified, setIsVerified] = useState(true);
    const [activeTab, setActiveTab] = useState('Informasi Umum');

    const tabs = [
        "Informasi Umum",
        "Tanggal Dan Lokasi",
        "Pajak Hiburan",
        "Biaya Platform"
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

                // Check Verification
                const { data: creatorData } = await supabase
                    .from('creators')
                    .select('verified')
                    .eq('id', data?.creator_id || '')
                    .single();

                setIsVerified(creatorData?.verified ?? false);

                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!isVerified) return <VerificationPending />;
    if (!event) return <div className="p-10 text-center text-red-500">Event not found</div>;

    return (
        <div className="space-y-8 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: Dynamic Content */}
                <div className="lg:col-span-9 order-2 lg:order-1">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm min-h-[500px]">
                        {/* Dynamic Content */}
                        <div>
                            {/* General Info Tab */}
                            {activeTab === 'Informasi Umum' && (
                                <GeneralInfoManagement
                                    eventId={eventId}
                                    eventData={event}
                                    onUpdate={() => {
                                        const fetchEvent = async () => {
                                            const { data } = await supabase
                                                .from('events')
                                                .select('*')
                                                .eq('id', eventId)
                                                .single();
                                            if (data) setEvent(data);
                                        };
                                        fetchEvent();
                                    }}
                                />
                            )}

                            {/* Date & Location Tab */}
                            {activeTab === 'Tanggal Dan Lokasi' && (
                                <DateTimeLocationManagement
                                    eventId={eventId}
                                    eventData={event}
                                    onUpdate={() => {
                                        const fetchEvent = async () => {
                                            const { data } = await supabase
                                                .from('events')
                                                .select('*')
                                                .eq('id', eventId)
                                                .single();
                                            if (data) setEvent(data);
                                        };
                                        fetchEvent();
                                    }}
                                />
                            )}

                            {/* Tax Tab */}
                            {activeTab === 'Pajak Hiburan' && (
                                <TaxManagementSection eventId={eventId} />
                            )}

                            {/* Platform Fee Tab */}
                            {activeTab === 'Biaya Platform' && (
                                <PlatformFeeManagementSection eventId={eventId} />
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Sidebar Tabs */}
                <aside className="lg:col-span-3 order-1 lg:order-2 space-y-4 lg:sticky lg:top-6">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 px-2">Navigation</p>
                        <div className="space-y-2">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab;
                                let Icon = Info;
                                if (tab === "Tanggal Dan Lokasi") Icon = Calendar;
                                if (tab === "Pajak Hiburan") Icon = Tag;
                                if (tab === "Biaya Platform") Icon = Settings;

                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`
                                            w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group
                                            ${isActive
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100'}
                                        `}
                                    >
                                        <div className={`
                                            w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                                            ${isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:shadow-sm'}
                                        `}>
                                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                        </div>
                                        <span className="text-sm font-semibold tracking-tight">{tab}</span>
                                        {isActive && (
                                            <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Help Card */}
                    <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                        <div className="relative z-10 space-y-4">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <Info size={18} className="text-blue-400" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-sm">Butuh Bantuan?</h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed">Kelola event Anda dengan mudah. Jika ada kendala, hubungi tim support kami.</p>
                            </div>
                            <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all border border-white/10">
                                Buka Pusat Bantuan
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default EventDetail;
