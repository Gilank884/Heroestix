import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    Save,
    ClipboardList,
    CheckCircle2,
    AlertCircle,
    Info,
    Layout,
    Plus,
    Trash2,
    GripVertical,
    Activity,
    Settings,
    Edit3,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdditionalForm = () => {
    const { id: eventId } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    // formFields is an array of objects: { id: string, active: boolean, label: string }
    const [formFields, setFormFields] = useState([]);

    useEffect(() => {
        const fetchEventSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('events')
                    .select('custom_form')
                    .eq('id', eventId)
                    .single();

                if (error) throw error;

                if (data?.custom_form) {
                    let rawData = data.custom_form;
                    if (typeof rawData === 'string') {
                        try {
                            rawData = JSON.parse(rawData);
                        } catch (e) {
                            rawData = [];
                        }
                    }

                    if (Array.isArray(rawData)) {
                        setFormFields(rawData);
                    } else if (typeof rawData === 'object' && rawData !== null) {
                        const fields = Object.entries(rawData)
                            .filter(([_, val]) => val && (val.active || val.label))
                            .map(([key, val], index) => ({
                                id: key,
                                active: !!val.active,
                                label: val.label || '',
                                order: index
                            }));
                        setFormFields(fields.length > 0 ? fields : []);
                    }
                }
            } catch (error) {
                console.error('Error fetching event settings:', error);
                setStatus({ type: 'error', message: 'Gagal mengambil pengaturan formulir.' });
            } finally {
                setLoading(false);
            }
        };

        fetchEventSettings();
    }, [eventId]);

    const handleAddField = () => {
        const newField = {
            id: `field_${Date.now()}`,
            active: true,
            label: ''
        };
        setFormFields([...formFields, newField]);
    };

    const handleRemoveField = (id) => {
        setFormFields(formFields.filter(f => f.id !== id));
    };

    const handleToggleField = (id) => {
        setFormFields(formFields.map(f =>
            f.id === id ? { ...f, active: !f.active } : f
        ));
    };

    const handleLabelChange = (id, value) => {
        setFormFields(formFields.map(f =>
            f.id === id ? { ...f, label: value } : f
        ));
    };

    const handleSave = async () => {
        const hasEmptyLabels = formFields.some(f => f.active && !f.label.trim());
        if (hasEmptyLabels) {
            setStatus({ type: 'error', message: 'Semua label kolom aktif wajib diisi.' });
            return;
        }

        setSaving(true);
        setStatus({ type: '', message: '' });

        try {
            const { error } = await supabase
                .from('events')
                .update({ custom_form: formFields })
                .eq('id', eventId);

            if (error) throw error;

            setStatus({ type: 'success', message: 'Pengaturan formulir berhasil disimpan!' });
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        } catch (error) {
            console.error('Error saving form settings:', error);
            setStatus({ type: 'error', message: 'Gagal menyimpan pengaturan.' });
        } finally {
            setSaving(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
    };

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Edit3 size={20} className="text-blue-600 animate-pulse" />
                    </div>
                </div>
                <div className="space-y-1 text-center">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] block">FORM BUILDER</span>
                    <span className="text-[10px] text-slate-400 font-bold">Harap tunggu, kami sedang memuat konfigurasi formulir...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pb-20">

            <motion.div 
                className="relative z-10 space-y-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Unified Header Card */}
                <motion.div 
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 space-y-8"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                                    Event Setup
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom Form Builder</span>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    Formulir Tambahan <ClipboardList className="text-blue-600" size={32} />
                                </h1>
                                <p className="text-slate-500 font-medium text-sm mt-3 max-w-2xl leading-relaxed">
                                    Sesuaikan data yang ingin Anda ambil dari pengunjung saat melakukan registrasi. Tambah kolom seperti Ukuran Kaos, ID Member, dan lainnya.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <motion.button 
                                onClick={handleAddField}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-[1.25rem] shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all group"
                            >
                                <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                                Tambah Kolom
                            </motion.button>
                            <motion.button 
                                onClick={handleSave}
                                disabled={saving}
                                whileHover={!saving ? { scale: 1.05 } : {}}
                                whileTap={!saving ? { scale: 0.95 } : {}}
                                className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.25rem] shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all disabled:opacity-50 group shrink-0"
                            >
                                {saving ? <Activity size={14} className="animate-spin" /> : <Save size={14} />}
                                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </motion.button>
                        </div>
                    </div>

                    {/* Notification Toast (Integrated) */}
                    <AnimatePresence>
                        {status.message && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className={`p-5 rounded-2xl border flex items-center gap-4 transition-all ${
                                    status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                                    {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                </div>
                                <p className="text-xs font-black uppercase tracking-widest">{status.message}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Main Builder Area (Full Width) */}
                <div className="space-y-6">
                    <AnimatePresence mode="popLayout">
                        {formFields.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-24 text-center bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-dashed border-slate-200 shadow-inner"
                            >
                                <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <Layout size={40} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Katalog Formulir Kosong</h3>
                                <p className="text-slate-400 text-xs font-bold mt-2 max-w-xs mx-auto uppercase tracking-widest">Klik "Tambah Kolom" di atas untuk kustomisasi registrasi Anda.</p>
                            </motion.div>
                        ) : (
                            formFields.map((field, index) => (
                                <motion.div
                                    key={field.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`
                                        group bg-white/80 backdrop-blur-xl rounded-[1.5rem] border transition-all duration-500 overflow-hidden flex flex-col md:flex-row items-stretch
                                        ${field.active ? 'border-white shadow-xl shadow-slate-200/40' : 'border-slate-100 opacity-60 grayscale'}
                                    `}
                                >
                                    <div className={`p-4 border-r border-slate-50 flex items-center gap-4 ${field.active ? 'bg-blue-50/10' : 'bg-slate-50/50'}`}>
                                        <div className="block">
                                            <GripVertical size={16} className="text-slate-200 cursor-grab active:cursor-grabbing" />
                                        </div>
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] shadow-sm ${field.active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {index + 1}
                                        </div>
                                    </div>

                                    <div className="p-4 flex-1 flex flex-col md:flex-row items-center gap-4">
                                        <div className="w-full flex-1 space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Label Kolom</label>
                                            <input
                                                type="text"
                                                value={field.label}
                                                onChange={(e) => handleLabelChange(field.id, e.target.value)}
                                                placeholder="Misal: Ukuran Baju..."
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 placeholder:text-slate-300 text-sm"
                                            />
                                        </div>

                                        <div className="flex items-center gap-4 pt-4 md:pt-0">
                                            <div className="flex flex-col items-end gap-1.5">
                                                <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Enable</p>
                                                <button
                                                    onClick={() => handleToggleField(field.id)}
                                                    className={`
                                                        relative inline-flex h-6 w-10 items-center rounded-full transition-all duration-500 shadow-inner
                                                        ${field.active ? 'bg-blue-600' : 'bg-slate-200'}
                                                    `}
                                                >
                                                    <motion.span 
                                                        layout
                                                        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
                                                        animate={{ x: field.active ? '1.25rem' : '0.25rem' }}
                                                    />
                                                </button>
                                            </div>

                                            <div className="h-10 w-px bg-slate-100 hidden md:block" />

                                            <motion.button
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleRemoveField(field.id)}
                                                className="p-3 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default AdditionalForm;
