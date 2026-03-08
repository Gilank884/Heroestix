import React, { useState } from 'react';
import { HiX, HiQrcode, HiSearch, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import { supabase } from '../../lib/supabaseClient';

const TicketControlModal = ({ isOpen, onClose }) => {
    const [qrValue, setQrValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [ticketInfo, setTicketInfo] = useState(null);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

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
                setError("Ticket not found or invalid QR code.");
            } else {
                setTicketInfo(data);
            }
        } catch (err) {
            setError("Error searching ticket.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAccess = async () => {
        if (!ticketInfo) return;
        setLoading(true);
        try {
            const { error: updateError } = await supabase
                .from('tickets')
                .update({ status: 'used' }) // or 'scanned'
                .eq('id', ticketInfo.id);

            if (updateError) throw updateError;

            // Re-fetch or update local state
            setTicketInfo(prev => ({ ...prev, status: 'used' }));
            alert("Entry Verified! Ticket marked as used.");
        } catch (err) {
            alert("Error verifying access: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                            <HiQrcode size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight text-left">Access Control</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-left">Ticket Verification System</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <HiX size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Search Area */}
                    <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block text-left">Manual QR / Ticket ID Entry</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    value={qrValue}
                                    onChange={(e) => setQrValue(e.target.value)}
                                    placeholder="Enter QR Code String..."
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="bg-slate-900 text-white px-8 rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                                {loading ? "..." : "SEARCH"}
                            </button>
                        </div>
                    </div>

                    {/* Simulation Message */}
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 italic">
                        <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">i</div>
                        <p className="text-xs text-blue-700 font-medium leading-relaxed text-left">
                            In a production environment, this module would interface with a mobile camera for direct QR scanning. For this console, please use manual entry.
                        </p>
                    </div>

                    {/* Result Area */}
                    <div className="min-h-[200px] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl p-6">
                        {ticketInfo ? (
                            <div className="w-full space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Ticket Class</p>
                                        <p className="text-2xl font-black text-slate-900">{ticketInfo.ticket_types?.name}</p>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${ticketInfo.status === 'unused' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {ticketInfo.status}
                                    </div>
                                </div>
                                <div className="space-y-4 text-left">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Event</p>
                                        <p className="text-sm font-bold text-slate-700">{ticketInfo.ticket_types?.events?.title}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QR Payload</p>
                                        <p className="text-xs font-mono text-slate-500">{ticketInfo.qr_code}</p>
                                    </div>
                                </div>

                                {ticketInfo.status === 'unused' ? (
                                    <button
                                        onClick={handleVerifyAccess}
                                        disabled={loading}
                                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <HiCheckCircle size={18} />
                                        Verify & Authorize Entry
                                    </button>
                                ) : (
                                    <div className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest border border-slate-200 flex items-center justify-center gap-2">
                                        <HiExclamationCircle size={18} />
                                        Ticket Already Scanned
                                    </div>
                                )}
                            </div>
                        ) : error ? (
                            <div className="text-center space-y-2">
                                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <HiExclamationCircle size={28} />
                                </div>
                                <p className="font-bold text-slate-900 uppercase text-sm">{error}</p>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto transition-transform hover:scale-110">
                                    <HiQrcode size={32} />
                                </div>
                                <p className="text-slate-400 font-bold text-sm tracking-tight italic">Waiting for scan data...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer hint */}
                <div className="p-6 bg-slate-50 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Heroestix Security Protocol v1.0</p>
                </div>
            </div>
        </div>
    );
};

export default TicketControlModal;
