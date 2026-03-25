import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { generateMOUPDF } from '../../utils/pdfGenerator';
import {
    FileText,
    Search,
    ShieldCheck,
    Download,
    Building2,
    Database,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DevDocuments = () => {
    const [creators, setCreators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCreator, setSelectedCreator] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(null);

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

    const handleDownloadMOU = async (creator) => {
        setIsGeneratingPDF(creator.id);
        try {
            await generateMOUPDF({
                brand_name: creator.brand_name,
                company_address: creator.company_address || creator.address,
                director_name: creator.director_name,
                phone: creator.phone || '',
                email: creator.email,
                bank_name: creator.bank_name,
                bank_account_holder: creator.bank_holder_name,
                bank_account_number: creator.bank_account,
                // Pass document URLs for the appendix
                ktp_pic_url: creator.ktp_pic_url,
                npwp_pic_url: creator.npwp_pic_url,
                npwp_company_url: creator.npwp_company_url,
                akte_notaris_url: creator.akte_notaris_url,
                nib_url: creator.nib_url,
                bank_book_pic_url: creator.bank_book_pic_url // Assuming this field might exist or be added
            });
        } catch (err) {
            alert("Failed to download PDF. Please try again.");
        } finally {
            setIsGeneratingPDF(null);
        }
    };

    const filteredCreators = creators.filter(c => {
        return (c.brand_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
               (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
               (c.director_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Loading Document Records...</span>
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
                             Legal & Compliance
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Merchant Documents
                        </span>
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Contract <span className="text-blue-600">Vault</span> <FileText className="text-blue-600" size={32} />
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                            Manage partnership agreements, creator documentations, and compliance certifications globally.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchCreators} 
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-100 border border-blue-500 hover:bg-blue-700"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Sync Vault
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
                        <AlertCircle size={16} className="text-red-400" />
                        <span>System Sync Issue: {error}. Data integrity may be affected.</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Interface */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Tools */}
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 focus-within:bg-white focus-within:border-blue-400 focus-within:text-blue-500 transition-all w-full md:w-80 shadow-sm">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search by brand, email, or director..."
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
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Creator Info</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Entity</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement Info</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Export</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCreators.map((creator, idx) => (
                                <tr
                                    key={creator.id}
                                    className="group transition-all hover:bg-slate-50"
                                >
                                    <td className="p-6 text-center text-xs font-bold text-slate-400">
                                        {idx + 1}
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 overflow-hidden relative shadow-sm group-hover:border-blue-200 transition-all">
                                                {creator.image_url ? (
                                                    <img
                                                        src={creator.image_url}
                                                        alt={creator.brand_name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                    />
                                                ) : null}
                                                <div className={`absolute inset-0 flex items-center justify-center ${creator.image_url ? 'hidden' : ''}`}>
                                                    {creator.brand_name?.charAt(0) || <Building2 size={16} />}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">{creator.brand_name || 'Anonymous Brand'}</h4>
                                                <p className="text-[10px] text-slate-500 mt-0.5">{creator.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-600">{creator.director_name || creator.profiles?.full_name || 'N/A'}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 mt-0.5">{creator.golongan || 'General'}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-600">{creator.bank_account || 'N/A'}</span>
                                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{creator.bank_name || 'Bank Not Set'} - {creator.bank_holder_name}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <button 
                                            onClick={() => handleDownloadMOU(creator)}
                                            disabled={isGeneratingPDF === creator.id}
                                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 focus:ring-4 focus:ring-blue-50 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 w-36 mx-auto shadow-sm"
                                        >
                                            {isGeneratingPDF === creator.id ? (
                                                <><div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" /> Fetching...</>
                                            ) : (
                                                <><Download size={14} /> MOU PDF</>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredCreators.length === 0 && (
                    <div className="p-20 flex flex-col items-center justify-center opacity-50">
                        <Database size={48} className="text-slate-200 mb-4" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] italic">No document records found</p>
                    </div>
                )}
            </div>

            {/* Table remains unchanged */}
        </div>
    );
};

export default DevDocuments;
