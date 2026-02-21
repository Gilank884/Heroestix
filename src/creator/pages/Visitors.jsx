import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    Search,
    User,
    Mail,
    Phone,
    Calendar,
    Filter,
    Download,
    CheckCircle2,
    Clock,
    UserCircle,
    ClipboardList
} from 'lucide-react';

const Visitors = () => {
    const { id: eventId } = useParams();
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [customColumns, setCustomColumns] = useState([]);

    const fetchVisitors = async () => {
        setLoading(true);
        console.log("Fetching visitors for event:", eventId);
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select(`
                    *,
                    ticket_types!inner (
                        name,
                        event_id
                    ),
                    orders (
                        status
                    )
                `)
                .eq('ticket_types.event_id', eventId);

            if (error) {
                console.error('Error fetching visitors:', error);
                throw error;
            }
            console.log("Fetched visitors data:", data);
            setVisitors(data || []);
        } catch (error) {
            console.error('Error fetching visitors:', error);
        } finally {
            setLoading(false);
        }
    };

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
                            console.error('Error parsing custom_form:', e);
                            rawData = [];
                        }
                    }

                    if (Array.isArray(rawData)) {
                        setCustomColumns(rawData.filter(field => field.active && field.label));
                    } else if (typeof rawData === 'object' && rawData !== null) {
                        const fields = Object.entries(rawData)
                            .filter(([_, val]) => val && (val.active || val.label))
                            .map(([key, val]) => ({
                                id: key,
                                active: !!val.active,
                                label: val.label || ''
                            }))
                            .filter(f => f.active && f.label);
                        setCustomColumns(fields);
                    }
                }
            } catch (err) {
                console.error('Error fetching event settings for columns:', err);
            }
        };

        if (eventId) {
            fetchVisitors();
            fetchEventSettings();
        }
    }, [eventId]);

    const filteredVisitors = visitors.filter(v =>
        v.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.qr_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        Daftar <span className="text-[#1a36c7]">Pengunjung</span>
                    </h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                        Manajemen Data Pemegang Tiket
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs uppercase hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                        <Download size={16} /> Export Data
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-[#1a36c7] rounded-2xl flex items-center justify-center">
                        <User size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900">{visitors.length}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Pengunjung</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900">{visitors.filter(v => v.status === 'used').length}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selesai Check-in</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900">{visitors.filter(v => v.status === 'unused').length}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum Datang</p>
                    </div>
                </div>
            </div>

            {/* Control Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center gap-4 bg-slate-50/30">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama, email, atau ID tiket..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#1a36c7]/5 focus:border-[#1a36c7] transition-all placeholder:text-slate-300 shadow-sm"
                        />
                    </div>
                    <button className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all shadow-sm">
                        <Filter size={18} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Pengunjung</th>
                                <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Kategori Tiket</th>
                                <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Info Kontak</th>
                                {customColumns.map(col => (
                                    <th key={col.id || col.label} className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                        {col.label}
                                    </th>
                                ))}
                                <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest text-center">Status Bayar</th>
                                <th className="px-6 py-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest text-center">Status Masuk</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-10 bg-slate-50/10"></td>
                                    </tr>
                                ))
                            ) : filteredVisitors.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                                <UserCircle size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium text-slate-900 uppercase tracking-wider">Data Tidak Ditemukan</p>
                                                <p className="text-slate-400 text-xs font-medium text-center max-w-xs mx-auto">
                                                    Belum ada pengunjung yang terdaftar atau kriteria pencarian Anda tidak sesuai.
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredVisitors.map((visitor) => (
                                <tr key={visitor.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#1a36c7]/5 flex items-center justify-center text-[#1a36c7] font-medium text-lg">
                                                {visitor.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 tracking-tight">{visitor.full_name}</p>
                                                <p className="text-[10px] font-mono text-slate-400">{visitor.qr_code}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="inline-flex px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium uppercase tracking-widest">
                                            {visitor.ticket_types?.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 space-y-1">
                                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                            <Mail size={12} className="text-slate-400" />
                                            {visitor.email || '-'}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                            <Phone size={12} className="text-slate-400" />
                                            {visitor.phone || '-'}
                                        </div>
                                    </td>
                                    {customColumns.map(col => (
                                        <td key={col.id || col.label} className="px-6 py-5">
                                            <p className="text-xs font-medium text-slate-700">
                                                {visitor.custom_responses?.[col.label] || '-'}
                                            </p>
                                        </td>
                                    ))}
                                    <td className="px-6 py-5 text-center">
                                        <div className={`
                                            inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest
                                            ${visitor.orders?.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                                        `}>
                                            {visitor.orders?.status || 'pending'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className={`
                                            inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest
                                            ${visitor.status === 'used' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
                                        `}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${visitor.status === 'used' ? 'bg-green-600' : 'bg-orange-600'}`} />
                                            {visitor.status === 'used' ? 'Selesai' : 'Siap'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Visitors;
