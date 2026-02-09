import React, { useState, useEffect } from 'react';
import useAuthStore from '../../auth/useAuthStore';
import { supabase } from '../../lib/supabaseClient';
import { HiPlus, HiCalendar, HiTicket, HiTrendingUp, HiQrcode, HiShieldCheck, HiCash } from 'react-icons/hi';

import { useNavigate } from 'react-router-dom';
import TicketControlModal from '../components/TicketControlModal';

const CreatorDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState({
        totalEvents: 0,
        totalTickets: 0,
        totalQuota: 0
    });
    const [loading, setLoading] = useState(true);
    const [showControlModal, setShowControlModal] = useState(false);

    const [isVerified, setIsVerified] = useState(true); // Default true to prevent flash

    useEffect(() => {
        if (user?.id) {
            fetchDashboardData();
        }
    }, [user?.id]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 0. Check Verification Status first
            const { data: creatorData, error: creatorError } = await supabase
                .from('creators')
                .select('verified')
                .eq('id', user.id)
                .single();

            const verified = creatorData?.verified ?? false;
            setIsVerified(verified);

            if (!verified) {
                setLoading(false);
                return; // Stop fetching if not verified
            }

            // 1. Fetch Events
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select(`
                    *,
                    ticket_types (
                        price,
                        quota,
                        sold
                    )
                `)
                .eq('creator_id', user.id);

            if (eventsError) throw eventsError;

            setEvents(eventsData || []);

            // 2. Calculate Stats
            let totalSold = 0;
            let totalQ = 0;

            eventsData?.forEach(ev => {
                ev.ticket_types?.forEach(tt => {
                    totalSold += tt.sold || 0;
                    totalQ += tt.quota || 0;
                });
            });

            setStats({
                totalEvents: eventsData?.length || 0,
                totalTickets: totalSold,
                totalQuota: totalQ
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }


    if (!isVerified) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-700">
                <div className="w-24 h-24 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                    <HiShieldCheck size={48} />
                </div>
                <div className="max-w-md space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Akun Dalam Peninjauan</h2>
                    <p className="text-slate-500 font-medium text-lg">
                        Terima kasih telah mendaftar! Tim kami sedang memverifikasi profil Anda.
                    </p>
                    <p className="text-slate-400 text-sm">
                        Proses ini biasanya memakan waktu 1x24 jam. Anda akan menerima notifikasi email setelah akun aktif.
                    </p>
                </div>
                <div className="pt-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
                    >
                        Refresh Status
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                        Core <span className="text-cyan-600">Console</span>
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">
                        Monitoring event operations and ticket distribution.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowControlModal(true)}
                        className="flex items-center justify-center gap-2 bg-white border-2 border-slate-900 text-slate-900 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <HiQrcode size={20} />
                        Scan Ticket QR
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                        <HiCalendar size={24} />
                    </div>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Active Operations</p>
                    <p className="text-3xl font-black text-slate-900 mt-2">{stats.totalEvents}</p>
                    <p className="text-xs text-blue-600 font-bold mt-4 flex items-center gap-1">
                        <HiTrendingUp /> {stats.totalEvents} campaigns live
                    </p>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                        <HiTicket size={24} />
                    </div>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Tickets Distributed</p>
                    <p className="text-3xl font-black text-slate-900 mt-2">{stats.totalTickets.toLocaleString()}</p>
                    <p className="text-xs text-green-600 font-bold mt-4 flex items-center gap-1">
                        <HiShieldCheck /> Verified check-ins active
                    </p>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                        <HiCash size={24} />
                    </div>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Total Market Quota</p>
                    <p className="text-3xl font-black text-slate-900 mt-2">{stats.totalQuota.toLocaleString()}</p>
                    <p className="text-xs text-orange-600 font-bold mt-4 flex items-center gap-1">
                        Inventory utilization: {Math.round((stats.totalTickets / stats.totalQuota) * 100) || 0}%
                    </p>
                </div>
            </div>

            {/* Content Tabs/Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Events Table */}
                <div className="lg:col-span-12 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900">Operation Center</h3>
                        <button className="text-xs font-bold text-cyan-600 hover:text-cyan-700 uppercase tracking-widest">View Archives</button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                                    <th className="pb-4 pl-4">Operation Name</th>
                                    <th className="pb-4">Status</th>
                                    <th className="pb-4">Schedule</th>
                                    <th className="pb-4">Market Cap</th>
                                    <th className="pb-4 text-right pr-4">Units Sold</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {events.length > 0 ? (
                                    events.map((ev) => (
                                        <tr key={ev.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-6 pl-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                                        <img src={ev.poster_url || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 leading-tight">{ev.title}</p>
                                                        <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-tight">{ev.location}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${ev.status === 'active' ? 'bg-cyan-100 text-cyan-700' :
                                                    ev.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                                                        'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {ev.status}
                                                </span>
                                            </td>
                                            <td className="py-6">
                                                <p className="text-sm font-bold text-slate-700">{ev.event_date}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{ev.event_time}</p>
                                            </td>
                                            <td className="py-6">
                                                <p className="text-sm font-bold text-slate-900">
                                                    {ev.ticket_types?.length} Categories
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Ticket Control</p>
                                            </td>
                                            <td className="py-6 text-right pr-4">
                                                <p className="text-sm font-black text-slate-900">
                                                    {ev.ticket_types?.reduce((acc, curr) => acc + (curr.sold || 0), 0)} / {ev.ticket_types?.reduce((acc, curr) => acc + (curr.quota || 0), 0)}
                                                </p>
                                                <div className="w-24 bg-slate-100 h-1 rounded-full overflow-hidden ml-auto mt-2">
                                                    <div
                                                        className="bg-cyan-500 h-full rounded-full"
                                                        style={{ width: `${(ev.ticket_types?.reduce((acc, curr) => acc + (curr.sold || 0), 0) / ev.ticket_types?.reduce((acc, curr) => acc + (curr.quota || 0), 0)) * 100 || 0}%` }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center">
                                            <p className="text-slate-400 font-bold text-sm">No operations deployed yet.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <TicketControlModal
                isOpen={showControlModal}
                onClose={() => setShowControlModal(false)}
            />
        </div>
    );
};

export default CreatorDashboard;
