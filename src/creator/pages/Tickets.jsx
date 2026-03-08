import React, { useState, useEffect } from 'react';
import useAuthStore from '../../auth/useAuthStore';
import { supabase } from '../../lib/supabaseClient';
import { HiTicket, HiTrendingUp, HiExclamation, HiCheckCircle } from 'react-icons/hi';

const Tickets = () => {
    const { user } = useAuthStore();
    const [eventTickets, setEventTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchTicketStats();
        }
    }, [user?.id]);

    const fetchTicketStats = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('events')
                .select(`
                    id,
                    title,
                    ticket_types (
                        id,
                        name,
                        price,
                        quota,
                        sold
                    )
                `)
                .eq('creator_id', user.id);

            if (error) throw error;
            setEventTickets(data || []);
        } catch (error) {
            console.error('Error fetching ticket stats:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const rupiah = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#1b3bb6] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight text-left uppercase">
                    Ticket <span className="text-[#1b3bb6]">Control</span>
                </h2>
                <p className="text-slate-500 font-bold mt-1 text-left text-xs uppercase tracking-widest">Inventory utilization and ticket distribution.</p>
            </div>

            {/* Event Ticket Sections */}
            <div className="space-y-12">
                {eventTickets.length > 0 ? eventTickets.map((event) => (
                    <div key={event.id} className="space-y-6">
                        <div className="flex items-center gap-4 px-4 border-l-4 border-[#1b3bb6]">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase tracking-[0.1em]">{event.title}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {event.ticket_types?.map((tt) => {
                                const utilization = Math.round((tt.sold / tt.quota) * 100) || 0;
                                return (
                                    <div key={tt.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                                        {/* Background Decor */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />

                                        <div className="relative z-10 space-y-6 text-left">
                                            <div className="flex items-center justify-between">
                                                <div className="w-10 h-10 bg-blue-50 text-[#1b3bb6] rounded-xl flex items-center justify-center">
                                                    <HiTicket size={20} />
                                                </div>
                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${utilization >= 100 ? 'bg-red-50 text-red-600' :
                                                    utilization >= 75 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                                                    }`}>
                                                    {utilization >= 100 ? <HiExclamation /> : <HiTrendingUp />}
                                                    {utilization}% Distributed
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-[15px] font-medium text-slate-900 truncate tracking-tight uppercase">{tt.name}</h4>
                                                <div className="mt-1 space-y-0.5">
                                                    <p className="text-[#1b3bb6] font-medium text-base tracking-tighter">{rupiah(tt.price_gross || tt.price)} <span className="text-[9px] text-slate-400 uppercase tracking-tighter">(Gross)</span></p>
                                                    <p className="text-slate-400 font-medium text-[10px] uppercase tracking-tighter">{rupiah(tt.price_net)} <span>(Net)</span></p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em]">
                                                    <span>Market Cap</span>
                                                    <span>{tt.sold} / {tt.quota} UNITS</span>
                                                </div>
                                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${utilization >= 90 ? 'bg-red-500' :
                                                            utilization >= 50 ? 'bg-[#1b3bb6]' : 'bg-cyan-500'
                                                            }`}
                                                        style={{ width: `${utilization}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-4 flex items-center gap-2">
                                                {tt.sold > 0 ? (
                                                    <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase tracking-wider">
                                                        <HiCheckCircle size={14} />
                                                        Processing entry logs...
                                                    </div>
                                                ) : (
                                                    <div className="text-slate-300 font-bold text-[10px] uppercase tracking-widest italic">
                                                        No units distributed yet
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )) : (
                    <div className="py-24 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
                        <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <HiTicket size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase">No ticket data found</h3>
                        <p className="text-slate-400 font-medium mt-2">Deploy an event with ticket types to see inventory distribution.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tickets;
