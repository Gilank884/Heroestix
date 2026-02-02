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
    GripVertical
} from 'lucide-react';

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

                // Backward compatibility: handle string, array, or object formats
                if (data?.custom_form) {
                    let rawData = data.custom_form;

                    // If it's a string, try to parse it
                    if (typeof rawData === 'string') {
                        try {
                            rawData = JSON.parse(rawData);
                        } catch (e) {
                            console.error('Error parsing custom_form string:', e);
                            rawData = [];
                        }
                    }

                    if (Array.isArray(rawData)) {
                        setFormFields(rawData);
                    } else if (typeof rawData === 'object' && rawData !== null) {
                        // Convert old object format { row_one: ... } to array
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
        // Validate
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

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        Formulir <span className="text-[#1a36c7]">Tambahan</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5 text-slate-400">
                        <ClipboardList size={12} className="text-blue-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Kustomisasi Data Pengunjung (Unlimited)</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleAddField}
                        className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-xs uppercase hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> Tambah Kolom
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`
                            px-6 py-2.5 rounded-xl bg-[#1a36c7] text-white font-bold text-xs uppercase 
                            hover:bg-[#152ba3] transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        {saving ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Menyimpan...</>
                        ) : (
                            <><Save size={16} /> Simpan Pengaturan</>
                        )}
                    </button>
                </div>
            </div>

            {/* Notification */}
            {status.message && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${status.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                    }`}>
                    {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <p className="text-sm font-bold">{status.message}</p>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-[2rem] p-6 flex gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                    <Info className="text-blue-600" size={24} />
                </div>
                <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Evolusi Formulir Unlimited</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Anda sekarang bisa menambah kolom tambahan sebanyak mungkin.
                        Pastikan Anda telah menjalankan perintah SQL untuk menambah kolom <b>custom_responses</b> di tabel tickets agar data pengunjung tersimpan sempurna.
                    </p>
                </div>
            </div>

            {/* Form Settings List */}
            <div className="space-y-4">
                {formFields.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Layout size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Belum ada kolom tambahan</h3>
                        <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">Klik tombol <b>Tambah Kolom</b> di atas untuk mulai mengumpulkan data tambahan dari pengunjung.</p>
                    </div>
                ) : (
                    formFields.map((field, index) => (
                        <div
                            key={field.id}
                            className={`
                                bg-white rounded-[1.5rem] border transition-all duration-300 overflow-hidden flex flex-col md:flex-row items-stretch
                                ${field.active ? 'border-blue-200 shadow-lg shadow-blue-500/5' : 'border-slate-100 shadow-sm opacity-80'}
                            `}
                        >
                            <div className={`p-6 border-r border-slate-50 flex items-center gap-4 ${field.active ? 'bg-blue-50/20' : 'bg-slate-50/50'}`}>
                                <GripVertical size={20} className="text-slate-300 cursor-grab active:cursor-grabbing" />
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${field.active ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400'}`}>
                                    <span className="font-bold text-sm">{index + 1}</span>
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col md:flex-row items-center gap-6">
                                <div className="w-full flex-1 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Label Kolom</label>
                                    <input
                                        type="text"
                                        value={field.label}
                                        onChange={(e) => handleLabelChange(field.id, e.target.value)}
                                        placeholder="Contoh: Ukuran Kaos, ID Member, No Polisi..."
                                        className={`
                                            w-full px-5 py-3 rounded-xl font-bold text-slate-700 transition-all border
                                            ${field.active
                                                ? 'bg-white border-slate-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500'
                                                : 'bg-slate-50 border-slate-100 text-slate-300'
                                            }
                                        `}
                                    />
                                </div>

                                <div className="flex items-center gap-6 pt-2 md:pt-0">
                                    <div className="flex flex-col items-end gap-1">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</p>
                                        <button
                                            onClick={() => handleToggleField(field.id)}
                                            className={`
                                                relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300
                                                ${field.active ? 'bg-blue-600' : 'bg-slate-200'}
                                            `}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${field.active ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="h-10 w-px bg-slate-100 hidden md:block"></div>

                                    <button
                                        onClick={() => handleRemoveField(field.id)}
                                        className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                                        title="Hapus Kolom"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={12} /> Live Sync Enabled
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                    Tips: Klik simpan setelah melakukan perubahan desain formulir.
                </p>
            </div>
        </div>
    );
};

export default AdditionalForm;
