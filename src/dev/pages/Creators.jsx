import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    ShieldCheck,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Creators = () => {
    const [creators, setCreators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();


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
                supabase.from('profiles').select('id, full_name, email')
            ]);

            if (creatorsRes.error) throw creatorsRes.error;

            const creatorsData = creatorsRes.data || [];
            const profilesData = profilesRes.data || [];
            const profileMap = profilesData.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

            const combined = creatorsData.map(c => ({
                ...c,
                profiles: profileMap[c.id] || null,
                email: profileMap[c.id]?.email || 'N/A' // Explicitly map email
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
            {/* Header section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                             Network Governance
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Creator Registry
                        </span>
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Merchant <span className="text-blue-600">Identities</span> <Users className="text-blue-600" size={32} />
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                            Manage global merchant identities, verification standards, and cross-platform access control.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchCreators} 
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-100 border border-blue-500 hover:bg-blue-700"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Sync Registry
                    </button>
                </div>
            </motion.div>

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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Tools */}
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
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

                {/* Table Layout */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">No</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Creator Identity</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Email</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCreators.map((creator, idx) => (
                                <tr
                                    key={creator.id}
                                    onClick={() => navigate(`/creators/${creator.id}`)}
                                    className={`group transition-all cursor-pointer hover:bg-slate-50`}
                                >
                                    <td className="p-6 text-center text-xs font-bold text-slate-400">
                                        {idx + 1}
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 overflow-hidden relative shadow-sm group-hover:border-blue-200 transition-all">
                                                {creator.image_url ? (
                                                    <img
                                                        src={creator.image_url}
                                                        alt={creator.brand_name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                    />
                                                ) : null}
                                                <div className={`absolute inset-0 flex items-center justify-center ${creator.image_url ? 'hidden' : ''}`}>
                                                    {creator.brand_name?.charAt(0) || <Building2 size={20} />}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">{creator.brand_name || 'Anonymous Brand'}</h4>
                                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {creator.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                {creator.profiles?.full_name?.charAt(0)}
                                            </div>
                                            <span className="text-sm font-bold text-slate-600">{creator.profiles?.full_name || 'Anonymous'}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-sm font-medium text-slate-500">{creator.email}</span>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wide ${creator.verified
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {creator.verified ? 'Verified' : 'Pending'}
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-blue-600 group-hover:border-blue-200 transition-all">
                                            <ArrowRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredCreators.length === 0 && (
                    <div className="p-20 flex flex-col items-center justify-center opacity-50">
                        <Users size={48} className="text-slate-200 mb-4" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] italic">No records in the current view</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Creators;
