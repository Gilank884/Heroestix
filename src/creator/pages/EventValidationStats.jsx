import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    Users,
    CheckCircle2,
    Clock,
    PieChart,
    BarChart3,
    ArrowRight,
    TrendingUp
} from 'lucide-react';

export default function EventValidationStats() {
    const { id: eventId } = useParams();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        checkedIn: 0,
        remaining: 0,
        byType: []
    });

    useEffect(() => {
        if (eventId) {
            fetchStats();
        }
    }, [eventId]);

    const fetchStats = async () => {
        setLoading(true);
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

            if (error) throw error;

            // Only count paid tickets for validation stats
            const validTickets = (data || []).filter(t => t.orders?.status === 'paid');
            const total = validTickets.length;
            const checkedIn = validTickets.filter(t => t.status === 'used').length;
            const remaining = total - checkedIn;

            // Stats by type
            const typesMap = {};
            validTickets.forEach(t => {
                const typeName = t.ticket_types?.name || 'Unknown';
                if (!typesMap[typeName]) {
                    typesMap[typeName] = { name: typeName, total: 0, checkedIn: 0 };
                }
                typesMap[typeName].total++;
                if (t.status === 'used') {
                    typesMap[typeName].checkedIn++;
                }
            });

            setStats({
                total,
                checkedIn,
                remaining,
                byType: Object.values(typesMap)
            });

        } catch (error) {
            console.error('Error fetching validation stats:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const checkInRate = stats.total > 0 ? (stats.checkedIn / stats.total) * 100 : 0;

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Menghitung Kehadiran...</span>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manajemen Kehadiran</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight text-center md:text-left">
                        Statistik Check-in
                    </h2>
                    <p className="text-slate-500 text-sm text-center md:text-left">Pantau perkembangan kedatangan pengunjung secara real-time.</p>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tiket</p>
                        <h4 className="text-3xl font-bold text-slate-900 tabular-nums">{stats.total}</h4>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sudah Masuk</p>
                        <h4 className="text-3xl font-bold text-green-600 tabular-nums">{stats.checkedIn}</h4>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Belum Datang</p>
                        <h4 className="text-3xl font-bold text-orange-600 tabular-nums">{stats.remaining}</h4>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Progress Card */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-900">Progres Kehadiran</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Persentase Kedatangan</p>
                        </div>
                        <div className="text-3xl font-bold text-blue-600">
                            {checkInRate.toFixed(1)}%
                        </div>
                    </div>

                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${checkInRate}%` }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Status Kehadiran</p>
                            <div className="flex items-center justify-center gap-2 text-slate-900">
                                <TrendingUp size={14} className="text-green-500" />
                                <span className="font-bold text-sm">Stabil</span>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">Sisa Kuota</p>
                            <div className="flex items-center justify-center gap-2 text-slate-900">
                                <Users size={14} className="text-blue-500" />
                                <span className="font-bold text-sm">{stats.remaining} Orang</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-5 bg-blue-600 rounded-full" />
                        <h3 className="text-lg font-bold text-slate-900">Berdasarkan Kategori</h3>
                    </div>

                    <div className="space-y-5">
                        {stats.byType.length > 0 ? stats.byType.map((type, idx) => {
                            const rate = (type.checkedIn / type.total) * 100;
                            return (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm">{type.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                {type.checkedIn} masuk / {type.total} terjual
                                            </p>
                                        </div>
                                        <p className="text-xs font-bold text-blue-600">{rate.toFixed(0)}%</p>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-500"
                                            style={{ width: `${rate}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="py-10 text-center text-slate-300 flex flex-col items-center gap-3">
                                <PieChart size={32} />
                                <p className="text-xs font-bold uppercase tracking-widest">Data tidak tersedia</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
