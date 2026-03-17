import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Building2,
    Mail,
    CreditCard,
    ShieldCheck,
    Clock,
    Settings,
    Save,
    Layout,
    Check
} from 'lucide-react';

const CreatorDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [creator, setCreator] = useState(null);
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [feeData, setFeeData] = useState({ name: 'Biaya Platform', type: 'fixed', value: 5000 });
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchCreator = async () => {
            try {
                // Fetch creator and profile data
                const { data: creatorData, error: creatorError } = await supabase
                    .from('creators')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (creatorError) throw creatorError;

                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', id)
                    .single();

                let contactEmail = profileData?.email;

                // Fallback: Fetch from Auth if email is missing in profile
                if (!contactEmail) {
                    const { data: authData, error: authError } = await supabase.functions.invoke('debug-user', {
                        body: { user_id: id }
                    });

                    if (!authError && authData?.auth_user?.user?.email) {
                        contactEmail = authData.auth_user.user.email;
                    }
                }

                if (profileData) {
                    setCreator({ ...creatorData, profiles: profileData, email: contactEmail || 'N/A' });
                } else {
                    setCreator({ ...creatorData, email: contactEmail || 'N/A' });
                }
            } catch (error) {
                console.error("Error fetching creator:", error);
                alert("Creator not found or error loading data.");
                navigate('/creators');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCreator();
            fetchActiveEvents();
        }
    }, [id, navigate]);

    const fetchActiveEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('id, title, poster_url')
                .eq('creator_id', id)
                .eq('status', 'active');

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error("Error fetching creator events:", error);
        }
    };

    const handleSelectEvent = async (event) => {
        setSelectedEvent(event);
        try {
            const { data, error } = await supabase
                .from('event_platform_fees')
                .select('*')
                .eq('event_id', event.id)
                .maybeSingle();

            if (data) {
                setFeeData({
                    name: data.name || 'Biaya Platform',
                    type: data.type || 'fixed',
                    value: data.value || 0
                });
            } else {
                setFeeData({ name: 'Biaya Platform', type: 'fixed', value: 5000 });
            }
        } catch (error) {
            console.error("Error fetching event fee:", error);
        }
    };

    const handleSaveFee = async () => {
        if (!selectedEvent) return;
        setSaving(true);
        try {
            const payload = {
                event_id: selectedEvent.id,
                name: feeData.name,
                type: feeData.type,
                value: parseFloat(feeData.value) || 0
            };

            const { data: existing } = await supabase
                .from('event_platform_fees')
                .select('id')
                .eq('event_id', selectedEvent.id)
                .maybeSingle();

            let error;
            if (existing) {
                const { error: updateError } = await supabase
                    .from('event_platform_fees')
                    .update(payload)
                    .eq('event_id', selectedEvent.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('event_platform_fees')
                    .insert(payload);
                error = insertError;
            }

            if (error) throw error;
            
            setSuccessMessage(`Fee for "${selectedEvent.title}" updated!`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            alert('Gagal menyimpan: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleVerification = async () => {
        try {
            const newStatus = !creator.verified;
            const { error } = await supabase
                .from('creators')
                .update({ verified: newStatus })
                .eq('id', id);

            if (error) throw error;
            setCreator({ ...creator, verified: newStatus });
        } catch (error) {
            alert('Error updating verification status: ' + error.message);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
    );

    if (!creator) return null;

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Header / Nav */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/creators')}
                    className="flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-all mb-4"
                >
                    <ArrowLeft size={20} /> Back to List
                </button>
                <h1 className="text-3xl font-extrabold text-slate-900">Creator Details</h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Hero / ID Section */}
                <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-white border border-slate-200 rounded-[1.5rem] flex items-center justify-center text-blue-600 font-bold text-3xl shadow-sm uppercase overflow-hidden relative">
                                {creator.image_url ? (
                                    <img
                                        src={creator.image_url}
                                        alt={creator.brand_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    creator.brand_name?.charAt(0) || <Building2 size={32} />
                                )}
                            </div>
                            <div>
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-3 ${creator.verified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                    {creator.verified ? <ShieldCheck size={14} /> : <Clock size={14} />}
                                    {creator.verified ? 'Verified Entity' : 'Pending Review'}
                                </div>
                                <h1 className="text-4xl font-extrabold text-slate-900 italic tracking-tight">{creator.brand_name || 'System Merchant'}</h1>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1a36c7]" />
                                    <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Ownership: <span className="text-[#1a36c7]">{creator.profiles?.full_name || 'Anonymous Entity'}</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] font-mono opacity-60">NODE-ID: {creator.id}</p>
                            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] opacity-60">Registered: {new Date(creator.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 p-10">

                    {/* Left Column */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Operational Identity</h4>

                            <div className="grid grid-cols-1 gap-4">
                                <InfoField
                                    icon={<Mail size={18} />}
                                    label="Contact Email"
                                    value={creator.email}
                                />
                                <InfoField
                                    icon={<Building2 size={18} />}
                                    label="Address"
                                    value={creator.address || "No address provided."}
                                />
                                <div className="group/field">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-0.5">
                                        Description
                                    </label>
                                    <div className="bg-slate-50/50 rounded-xl px-5 py-4 border border-slate-200 group-hover/field:border-blue-600/30 transition-colors">
                                        <p className="font-medium text-slate-600 text-sm leading-relaxed">{creator.description || "No description provided."}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Settlement Configuration</h4>
                            <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-xl relative overflow-hidden group">
                                <div className="relative z-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                            <CreditCard size={20} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{creator.bank_name || 'NOT SET'}</span>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold tracking-[0.15em] mb-4">
                                            {creator.bank_account || '**** **** ****'}
                                        </p>
                                        <div className="flex flex-col">
                                            <p className="text-[9px] font-black uppercase opacity-40 tracking-widest mb-1">Account Holder</p>
                                            <p className="text-xs font-black uppercase tracking-tight">{creator.bank_holder_name || creator.brand_name || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all duration-700" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Actions</h4>
                            <button
                                onClick={handleToggleVerification}
                                className={`w-full py-5 font-black text-xs uppercase tracking-widest rounded-2xl border transition-all active:scale-95 shadow-sm flex items-center justify-center gap-3 ${creator.verified
                                    ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-blue-600/20 shadow-lg'
                                    }`}
                            >
                                {creator.verified ? (
                                    <>
                                        <XCircle size={18} /> Revoke Verification
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={18} /> Verify Entity
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Platform Fee Management Section */}
            <div className="mt-12 space-y-8">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                    <h2 className="text-2xl font-extrabold text-slate-900 italic">Ongoing <span className="text-blue-600 not-italic">Event Fees</span></h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Event List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Active Events</h4>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {events.length > 0 ? (
                                events.map((ev) => (
                                    <button
                                        key={ev.id}
                                        onClick={() => handleSelectEvent(ev)}
                                        className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 group ${selectedEvent?.id === ev.id
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                                            }`}
                                    >
                                        <div className="w-12 h-12 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden shrink-0">
                                            <img
                                                src={ev.poster_url || 'https://via.placeholder.com/150'}
                                                alt={ev.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`font-black text-xs uppercase tracking-tight truncate ${selectedEvent?.id === ev.id ? 'text-white' : 'text-slate-900'}`}>{ev.title}</p>
                                            <p className={`text-[9px] font-bold mt-1 ${selectedEvent?.id === ev.id ? 'text-blue-100' : 'text-slate-400'}`}>ID: {ev.id.substring(0, 8)}...</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <Layout size={24} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Active Events</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fee Configuration Form */}
                    <div className="lg:col-span-2">
                        {selectedEvent ? (
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[#1a36c7] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                            <Settings size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                Platform Configuration
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 italic mt-0.5">Adjusting fees for: {selectedEvent.title}</p>
                                        </div>
                                    </div>
                                    {successMessage && (
                                        <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-in zoom-in duration-300">
                                            <Check size={14} /> {successMessage}
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 space-y-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Label Name</label>
                                            <input
                                                type="text"
                                                value={feeData.name}
                                                onChange={e => setFeeData({ ...feeData, name: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all"
                                                placeholder="e.g. Platform Fee"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Fee Engine</label>
                                                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                                                    {['fixed', 'percentage'].map((type) => (
                                                        <button
                                                            key={type}
                                                            onClick={() => setFeeData({ ...feeData, type })}
                                                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feeData.type === type
                                                                ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                                                                : 'text-slate-400 hover:text-slate-600'
                                                                }`}
                                                        >
                                                            {type}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">
                                                    {feeData.type === 'fixed' ? 'Nominal Value (IDR)' : 'Percentage Value (%)'}
                                                </label>
                                                <div className="relative group">
                                                    <input
                                                        type="number"
                                                        value={feeData.value}
                                                        onChange={e => setFeeData({ ...feeData, value: e.target.value })}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all text-xl"
                                                    />
                                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl group-focus-within:text-blue-600 transition-colors">
                                                        {feeData.type === 'fixed' ? 'Rp' : '%'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSaveFee}
                                        disabled={saving}
                                        className="w-full bg-[#1a36c7] text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#152ba3] transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
                                    >
                                        {saving ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Save size={18} className="group-hover:rotate-12 transition-transform" />
                                        )}
                                        {saving ? 'Updating System...' : 'Synchronize Fee Data'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[400px] bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center opacity-60">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                                    <Settings size={32} className="text-slate-300" />
                                </div>
                                <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest italic">Node Selection Required</h3>
                                <p className="text-[11px] font-bold text-slate-400 mt-2 max-w-[280px]">Select an active event from the left panel to begin configuring its financial parameters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoField = ({ label, value, icon }) => (
    <div className="group/field">
        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-0.5">
            {icon}
            {label}
        </label>
        <div className="bg-slate-50/50 rounded-xl px-5 py-3 border border-slate-200 group-hover/field:border-blue-600/30 transition-colors">
            <span className="text-sm font-bold text-slate-900 truncate block">
                {value}
            </span>
        </div>
    </div>
);

export default CreatorDetail;
