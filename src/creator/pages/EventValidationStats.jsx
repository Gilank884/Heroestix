import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    Users,
    CheckCircle2,
    Clock,
    PieChart as LucidePieChart,
    BarChart3,
    ArrowRight,
    TrendingUp,
    RefreshCw,
    Activity
} from 'lucide-react';
import VerificationPending from '../components/VerificationPending';
import useAuthStore from '../../auth/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

export default function EventValidationStats() {
    const { id: eventId } = useParams();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        checkedIn: 0,
        remaining: 0,
        byType: []
    });
    const { user } = useAuthStore();
    const [isVerified, setIsVerified] = useState(true);

    useEffect(() => {
        if (eventId) {
            fetchStats();
        }
    }, [eventId]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Check Verification
            const { data: creatorData } = await supabase
                .from('creators')
                .select('verified')
                .eq('id', user.id)
                .single();

            const verified = creatorData?.verified ?? false;
            setIsVerified(verified);
            if (!verified) { setLoading(false); return; }

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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 12
            }
        }
    };

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Activity size={20} className="text-blue-600 animate-pulse" />
                    </div>
                </div>
                <div className="space-y-1 text-center">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] block">SINKRONISASI DATA</span>
                    <span className="text-[10px] text-slate-400 font-bold">Harap tunggu, kami sedang mengumpulkan laporan terbaru...</span>
                </div>
            </div>
        );
    }

    if (!isVerified) return <VerificationPending />;

    const pieData = stats.total > 0 ? [
        { name: 'Sudah Masuk', value: stats.checkedIn, color: '#2563EB' }, // Electric Blue
        { name: 'Belum Datang', value: stats.remaining, color: '#F97316' }  // Sun Orange
    ] : [];

    const barData = stats.byType.map(type => ({
        name: type.name,
        Masuk: type.checkedIn,
        Belum: type.total - type.checkedIn,
        Total: type.total
    }));

    return (
        <div className="relative min-h-screen pb-20">

            <motion.div
                className="relative z-10 space-y-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header Overhaul - Unified Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-8"
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                                Real-time Analysis
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manajemen Kehadiran</span>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                Check-in Analytics <Activity className="text-blue-600" size={32} />
                            </h1>
                            <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                                Pantau perkembangan kedatangan pengunjung secara real-time lewat grafik interaktif dan laporan distribusi tiket.
                            </p>
                        </div>
                    </div>

                    <motion.button
                        onClick={fetchStats}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.25rem] shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all group shrink-0"
                    >
                        <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                        Refresh Data
                    </motion.button>
                </motion.div>

                {/* Metrics Overview - Unified Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        {[
                            { label: 'Total Tiket Terjual', value: stats.total, icon: Users, color: 'blue' },
                            { label: 'Tiket Berhasil Masuk', value: stats.checkedIn, icon: CheckCircle2, color: 'indigo' },
                            { label: 'Menunggu Kehadiran', value: stats.remaining, icon: Clock, color: 'orange' }
                        ].map((stat, idx) => (
                            <div key={idx} className={`flex items-start gap-6 ${idx > 0 ? 'md:pl-12' : ''} ${idx < 2 ? 'pb-8 md:pb-0' : 'pt-8 md:pt-0'}`}>
                                <div className={`w-14 h-14 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center text-${stat.color}-600 shrink-0`}>
                                    <stat.icon size={28} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">{stat.label}</p>
                                    <h4 className={`text-4xl font-black text-slate-900 tabular-nums tracking-tighter`}>
                                        {stat.value.toLocaleString()}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1 h-1 rounded-full bg-${stat.color}-500`} />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Update Otomatis</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Progress Card with Premium Pie Chart */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 space-y-10 flex flex-col items-center"
                    >
                        <div className="w-full flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Progres Kehadiran</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                    Statistik Keseluruhan
                                </p>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="text-4xl font-black text-blue-600 tabular-nums tracking-tighter">
                                    {checkInRate.toFixed(1)}%
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Rate Kedatangan</span>
                            </div>
                        </div>

                        <div className="w-full h-[320px] relative">
                            {stats.total > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={85}
                                            outerRadius={120}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                            animationDuration={1500}
                                            animationBegin={300}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                    className="outline-none"
                                                />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-100 shadow-2xl">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{data.name}</p>
                                                            <p className="text-lg font-black text-slate-900">{data.value} <span className="text-sm font-medium text-slate-400">Orang</span></p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            iconSize={10}
                                            wrapperStyle={{ fontSize: '12px', fontWeight: '900', paddingTop: '40px', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center shadow-inner">
                                        <LucidePieChart size={32} className="opacity-30" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Belum Ada Tiket Terjual</p>
                                </div>
                            )}

                            {/* Center Percent Overlay */}
                            {stats.total > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-[36px]">
                                    <div className="text-center group">
                                        <TrendingUp className="text-green-500 mx-auto mb-1 group-hover:scale-110 transition-transform" size={24} />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stabil</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Category Breakdown with Refined Bar Chart */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 space-y-10"
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Kategori Tiket</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Per Kelas Tiket</p>
                            </div>
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <BarChart3 size={24} />
                            </div>
                        </div>

                        <div className="w-full h-[320px]">
                            {barData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={barData}
                                        margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                                        barGap={10}
                                    >
                                        <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#E2E8F0" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fontWeight: '900', fill: '#94A3B8', textTransform: 'uppercase' }}
                                            dy={15}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fontWeight: '900', fill: '#94A3B8' }}
                                            allowDecimals={false}
                                        />
                                        <RechartsTooltip
                                            cursor={{ fill: '#f1f5f9', radius: 12 }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-slate-900/95 backdrop-blur-md px-5 py-4 rounded-2xl border border-slate-800 shadow-2xl">
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">{label}</p>
                                                            <div className="space-y-3">
                                                                {payload.map((item, i) => (
                                                                    <div key={i} className="flex items-center justify-between gap-6 whitespace-nowrap">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                                                                            <span className="text-xs font-bold text-slate-400">{item.name}</span>
                                                                        </div>
                                                                        <span className="text-sm font-black text-white tabular-nums">{item.value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="top"
                                            height={36}
                                            iconType="circle"
                                            iconSize={10}
                                            wrapperStyle={{ fontSize: '10px', fontWeight: '900', paddingBottom: '30px', textTransform: 'uppercase', color: '#64748b' }}
                                        />
                                        <Bar dataKey="Masuk" stackId="a" fill="#2563EB" radius={[0, 0, 8, 8]} barSize={45} />
                                        <Bar dataKey="Belum" stackId="a" fill="#F472B6" radius={[8, 8, 0, 0]} barSize={45} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center shadow-inner">
                                        <BarChart3 size={32} className="opacity-30" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Data Tidak Tersedia</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
