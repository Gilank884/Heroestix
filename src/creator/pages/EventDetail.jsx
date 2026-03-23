import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { 
    Info, 
    Calendar, 
    Tag, 
    ChevronLeft, 
    LayoutDashboard, 
    Settings, 
    HelpCircle, 
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Clock,
    MapPin,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GeneralInfoManagement from '../components/event-detail/GeneralInfoManagement';
import DateTimeLocationManagement from '../components/event-detail/DateTimeLocationManagement';
import TaxManagementSection from '../components/event-detail/TaxManagementSection';

const EventDetail = () => {
    const { id: eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isVerified, setIsVerified] = useState(true);
    const [activeTab, setActiveTab] = useState('Informasi Umum');

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 }
    };

    const tabs = [
        { name: "Informasi Umum", icon: Info },
        { name: "Tanggal Dan Lokasi", icon: Calendar },
        { name: "Pajak Hiburan", icon: Tag }
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

    if (loading && !event) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Settings size={20} className="text-blue-600 animate-pulse" />
                    </div>
                </div>
                <div className="space-y-1 text-center">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] block underline decoration-blue-500/30 underline-offset-8">CONFIG</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Memuat detail event...</span>
                </div>
            </div>
        );
    }

    if (!isVerified) return <VerificationPending />;
    if (!event) return <div className="p-10 text-center text-red-500">Event not found</div>;

    return (
        <div className="relative min-h-screen pb-20">

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="relative z-10 space-y-10 max-w-6xl mx-auto px-4 md:px-0"
            >

                {/* Back Button & Navigation */}
                <motion.div variants={itemVariants} className="flex justify-start">
                    <Link
                        to="/creator"
                        className="group flex items-center gap-3 px-6 py-3 bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-xl shadow-slate-200/20 text-slate-500 hover:text-blue-600 transition-all active:scale-95"
                    >
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-slate-100 group-hover:border-blue-100 transition-colors">
                            <ArrowLeft size={16} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Back to Management</span>
                    </Link>
                </motion.div>

                {/* Unified Header & Title Card */}
                <motion.div 
                    variants={itemVariants}
                    className="relative group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur-2xl opacity-5 group-hover:opacity-10 transition-opacity duration-700" />
                    <div className="relative bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                        
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 text-left">
                            <div className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                                        <Settings size={10} />
                                        Configuration Mode
                                    </div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Management Protocol v4.0</span>
                                </div>
                                <div className="space-y-4">
                                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                                        {event?.title || 'Detail Event'}
                                    </h1>
                                    <p className="text-slate-500 font-bold text-sm max-w-xl leading-relaxed uppercase tracking-tight opacity-70">
                                        Pantau detail, ubah waktu dan lokasi, serta kelola pengaturan pajak hiburan untuk kampanye operasional Anda.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-slate-200 group-hover:rotate-3 transition-transform duration-500">
                                    <Activity size={32} strokeWidth={2.5} className="text-blue-500 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: Main Configuration Cards */}
                    <div className="lg:col-span-9 space-y-8 min-h-[600px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 p-8 md:p-10"
                            >
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

                                {activeTab === 'Pajak Hiburan' && (
                                    <TaxManagementSection eventId={eventId} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* RIGHT COLUMN: Sidebar Navigation */}
                    <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-6">
                        <motion.div 
                            variants={itemVariants}
                            className="bg-white/60 backdrop-blur-xl p-5 rounded-[2rem] border border-white shadow-xl shadow-slate-200/30"
                        >
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-4 px-2 text-left">Navigation</p>
                            <div className="space-y-2">
                                {tabs.map((tab) => {
                                    const isActive = activeTab === tab.name;
                                    const Icon = tab.icon;

                                    return (
                                        <button
                                            key={tab.name}
                                            onClick={() => setActiveTab(tab.name)}
                                            className={`
                                                w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative
                                                ${isActive
                                                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                                                    : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-900'}
                                            `}
                                        >
                                            <div className={`
                                                w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm
                                                ${isActive ? 'bg-blue-600 text-white' : 'bg-white border border-slate-100 text-slate-400 group-hover:border-slate-300'}
                                            `}>
                                                <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-widest">{tab.name}</span>
                                            {isActive && (
                                                <div className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse mr-1" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Quick Help Integrated Design */}
                        <motion.div 
                            variants={itemVariants}
                            className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group"
                        >
                            <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-blue-600/20 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700" />
                            <div className="relative z-10 space-y-5 text-left">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 shadow-inner">
                                    <Info size={18} className="text-blue-400" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-black text-xs uppercase tracking-widest">Butuh Bantuan?</h4>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Punya pertanyaan seputar teknis atau konfigurasi event? Kami siap membantu.</p>
                                </div>
                                <button className="w-full py-3 bg-white/10 hover:bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95">
                                    Chat Support
                                </button>
                            </div>
                        </motion.div>
                    </aside>
                </div>
            </motion.div>
        </div>
    );
};

export default EventDetail;
