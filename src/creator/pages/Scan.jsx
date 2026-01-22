import React, { useState } from 'react';
import { HiQrcode, HiSearch, HiCheckCircle, HiExclamationCircle, HiChevronLeft } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const Scan = () => {
    const navigate = useNavigate();
    const [qrValue, setQrValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [ticketInfo, setTicketInfo] = useState(null);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        if (!qrValue.trim()) return;
        setLoading(true);
        setError(null);
        setTicketInfo(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('tickets')
                .select(`
                    *,
                    ticket_types (
                        name,
                        events (
                            title
                        )
                    )
                `)
                .eq('qr_code', qrValue.trim())
                .single();

            if (fetchError || !data) {
                setError("Invalid payload. Ticket not recognized.");
            } else {
                setTicketInfo(data);
            }
        } catch (err) {
            setError("Communication failure with security server.");
        } finally {
            setLoading(false);
            setQrValue(''); // Clear for next scan
        }
    };

    const handleVerifyAccess = async () => {
        if (!ticketInfo) return;
        setLoading(true);
        try {
            const { error: updateError } = await supabase
                .from('tickets')
                .update({ status: 'used' })
                .eq('id', ticketInfo.id);

            if (updateError) throw updateError;

            setTicketInfo(prev => ({ ...prev, status: 'used' }));
        } catch (err) {
            alert("Authorization denied: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white animate-in slide-in-from-right duration-500">
            {/* Minimal Sticky Header */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-50 p-6 flex items-center justify-between">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-colors"
                >
                    <HiChevronLeft size={20} />
                    Back to Console
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scanner Online</span>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-6 py-12 space-y-12">
                {/* Visual Scanner Simulation */}
                <div className="relative group text-center">
                    <div className="absolute inset-0 bg-[#b1451a]/5 rounded-[3rem] blur-2xl group-hover:bg-[#b1451a]/10 transition-colors" />
                    <div className="relative w-48 h-48 bg-white border-2 border-dashed border-[#b1451a]/30 rounded-[3rem] mx-auto flex items-center justify-center text-[#b1451a] shadow-xl group-hover:border-[#b1451a] transition-all duration-500">
                        <HiQrcode size={64} className="group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#b1451a]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem]" />
                    </div>
                </div>

                {/* Input Area */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center italic">AUTHORIZE <span className="text-[#b1451a]">ACCESS</span></h1>
                    <div className="flex gap-2">
                        <input
                            autoFocus
                            type="text"
                            value={qrValue}
                            onChange={(e) => setQrValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Awaiting QR Payload..."
                            className="flex-1 px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-[#b1451a] outline-none transition-all font-mono font-bold text-[#b1451a] tracking-widest text-center"
                        />
                    </div>
                </div>

                {/* Result Cards */}
                <div className="min-h-[320px]">
                    {ticketInfo ? (
                        <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 p-10 space-y-8 animate-in zoom-in-95 shadow-2xl shadow-slate-100 text-left">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket Holder Category</p>
                                    <h2 className="text-3xl font-black text-slate-900">{ticketInfo.ticket_types?.name}</h2>
                                </div>
                                <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${ticketInfo.status === 'unused' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {ticketInfo.status}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Permission For</p>
                                    <p className="text-lg font-bold text-slate-700 tracking-tight">{ticketInfo.ticket_types?.events?.title}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-xs text-slate-500 break-all">
                                    AUTH_REF: {ticketInfo.qr_code}
                                </div>
                            </div>

                            {ticketInfo.status === 'unused' ? (
                                <button
                                    onClick={handleVerifyAccess}
                                    disabled={loading}
                                    className="w-full py-5 bg-[#b1451a] hover:bg-[#8e3715] text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {loading ? "AUTHORIZING..." : <><HiCheckCircle size={24} /> CONFIRM ARRIVAL</>}
                                </button>
                            ) : (
                                <div className="w-full py-5 bg-slate-100 text-slate-400 rounded-[1.5rem] font-black uppercase tracking-[0.2em] border-2 border-slate-200 flex items-center justify-center gap-3 cursor-not-allowed">
                                    <HiExclamationCircle size={24} /> ACCESS PREVIOUSLY REDEEMED
                                </div>
                            )}
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 rounded-[2.5rem] border-2 border-red-100 p-10 text-center space-y-4 animate-in shake duration-300">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto">
                                <HiExclamationCircle size={32} />
                            </div>
                            <h3 className="text-xl font-black text-red-900 uppercase">Authorization Denied</h3>
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    ) : (
                        <div className="text-center py-20 space-y-6">
                            <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto animate-pulse">
                                <HiQrcode size={40} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-900 font-black uppercase tracking-widest">Awaiting Capture</p>
                                <p className="text-slate-400 text-sm font-medium">Position code within frame or enter manually</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Background Decor */}
            <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#b1451a]/20 to-transparent" />
        </div>
    );
};

export default Scan;
