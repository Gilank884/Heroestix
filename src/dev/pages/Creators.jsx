import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Users,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    MoreHorizontal,
    ExternalLink,
    Building2,
    Mail,
    Phone,
    ArrowRight,
    Filter,
    CreditCard,
    ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Creators = () => {
    const [creators, setCreators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCreator, setSelectedCreator] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');


    useEffect(() => {
        fetchCreators();
    }, []);

    const fetchCreators = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch creators and profiles separately for mapping
            const [creatorsRes, profilesRes] = await Promise.all([
                supabase.from('creators').select('*').order('created_at', { ascending: false }),
                supabase.from('profiles').select('id, full_name')
            ]);

            if (creatorsRes.error) throw creatorsRes.error;

            const creatorsData = creatorsRes.data || [];
            const profilesData = profilesRes.data || [];
            const profileMap = profilesData.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

            const combined = creatorsData.map(c => ({
                ...c,
                profiles: profileMap[c.id] || null
            }));

            setCreators(combined);
        } catch (err) {
            console.error('CRITICAL: Error merging creator data:', err.message);
            setError(err.message || 'Failed to fetch creators');
        } finally {
            setLoading(false);
        }
    };


    const handleToggleVerification = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('creators')
                .update({ verified: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchCreators();
            if (selectedCreator?.id === id) {
                setSelectedCreator({ ...selectedCreator, verified: !currentStatus });
            }
        } catch (error) {
            alert('Error updating verification status: ' + error.message);
        }
    };

    const filteredCreators = creators.filter(c => {
        const matchesFilter = filter === 'all' ? true : (filter === 'verified' ? c.verified : !c.verified);
        const matchesSearch = c.brand_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Accessing Creator Network...</span>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Network Governance</span>
                    </div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 italic">Creator <span className="text-blue-600 not-italic">Registry</span></h2>
                    <p className="text-slate-500 font-medium text-sm mt-2">Manage merchant identities and verification standards.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchCreators} className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all active:scale-95 shadow-sm">
                        Refresh Database
                    </button>
                </div>
            </div>

            {/* Error Display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-8 py-4 bg-red-50 border border-red-100 rounded-[1.5rem] flex items-center gap-3 text-red-600 text-xs font-bold shadow-sm"
                    >
                        <ShieldCheck size={16} className="text-red-400" />
                        <span>System Sync Issue: {error}. Data integrity may be affected.</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Interface */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                {/* Tools */}
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100 w-fit">
                        {['all', 'verified', 'unverified'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === f
                                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 focus-within:bg-white focus-within:border-blue-400 focus-within:text-blue-500 transition-all w-full md:w-80 shadow-sm">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search by brand or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium w-full placeholder:text-slate-400 text-slate-800"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 p-8 bg-slate-50/30">
                    {filteredCreators.map((creator, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={creator.id}
                            onClick={() => setSelectedCreator(creator)}
                            className={`group p-6 rounded-[2rem] border transition-all cursor-pointer flex flex-col relative overflow-hidden ${selectedCreator?.id === creator.id
                                ? 'bg-blue-50 border-blue-200 shadow-md ring-1 ring-blue-100'
                                : 'bg-white border-slate-100 hover:border-blue-100 hover:shadow-sm'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 transition-all shadow-sm">
                                        {creator.brand_name?.charAt(0) || <Building2 size={22} />}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-slate-900 text-sm truncate uppercase tracking-tight">{creator.brand_name || 'Anonymous Brand'}</h4>
                                        <p className="text-[10px] text-[#1a36c7] font-black uppercase mt-0.5 italic">Owner: {creator.profiles?.full_name || 'Anonymous'}</p>
                                        <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5 opacity-60">{creator.email}</p>
                                    </div>

                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${creator.verified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                    {creator.verified ? <ShieldCheck size={16} /> : <Clock size={16} />}
                                </div>
                            </div>

                            <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        ID: {creator.id.substring(0, 8)}
                                    </span>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-blue-600 group-hover:bg-white transition-all">
                                    <ArrowRight size={16} />
                                </div>
                            </div>

                            {selectedCreator?.id === creator.id && (
                                <motion.div layoutId="creator-highlight" className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
                            )}
                        </motion.div>
                    ))}

                    {filteredCreators.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-50">
                            <Users size={48} className="text-slate-200 mb-4" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] italic">No records in the current view</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Details Side Drawer Overlay */}
            <AnimatePresence>
                {selectedCreator && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedCreator(null)}
                        className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-50 flex items-center justify-end p-4 lg:p-10"
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg h-full bg-white rounded-[3rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
                        >
                            <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-[1.5rem] flex items-center justify-center text-blue-600 font-bold text-2xl shadow-sm uppercase">
                                        {selectedCreator.brand_name?.charAt(0)}
                                    </div>
                                    <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${selectedCreator.verified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                        {selectedCreator.verified ? 'Verified Entity' : 'Pending Review'}
                                    </div>
                                </div>
                                <h3 className="text-3xl font-extrabold text-slate-900 italic tracking-tight">{selectedCreator.brand_name || 'System Merchant'}</h3>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1a36c7]" />
                                    <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Ownership: <span className="text-[#1a36c7]">{selectedCreator.profiles?.full_name || 'Anonymous Entity'}</span></p>
                                </div>
                                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] mt-3 font-mono opacity-60">NODE-ID: {selectedCreator.id}</p>

                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Operational Identity</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Mail size={12} /> Contact Email
                                            </p>
                                            <p className="font-bold text-slate-900 truncate">{selectedCreator.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Settlement Configuration</h4>
                                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                                        <div className="relative z-10 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                                    <CreditCard size={20} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{selectedCreator.bank_name || 'NOT SET'}</span>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold tracking-[0.15em] mb-4">
                                                    {selectedCreator.bank_account || '**** **** ****'}
                                                </p>
                                                <div className="flex flex-col">
                                                    <p className="text-[9px] font-black uppercase opacity-40 tracking-widest mb-1">Entity Name</p>
                                                    <p className="text-xs font-black uppercase tracking-tight">{selectedCreator.brand_name}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all duration-700" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Registration Metadata</h4>
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Joined Platform</p>
                                        <p className="text-sm font-bold text-slate-900 italic">{new Date(selectedCreator.created_at).toLocaleDateString()} {new Date(selectedCreator.created_at).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 border-t border-slate-50 bg-slate-50/10 flex gap-4">
                                <button
                                    onClick={() => handleToggleVerification(selectedCreator.id, selectedCreator.verified)}
                                    className={`flex-1 py-4 font-black text-[10px] uppercase tracking-widest rounded-2xl border transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 ${selectedCreator.verified
                                        ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {selectedCreator.verified ? (
                                        <>
                                            <XCircle size={16} /> Revoke Verification
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} /> Verify Entity
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setSelectedCreator(null)}
                                    className="px-6 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Creators;
