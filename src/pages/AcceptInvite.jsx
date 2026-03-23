
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Layers, CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';

const AcceptInvite = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Memverifikasi undangan...');
    const [eventId, setEventId] = useState(null);

    const hasAttempted = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token undangan tidak valid atau hilang.');
            return;
        }

        if (!hasAttempted.current) {
            hasAttempted.current = true;
            handleAcceptInvite();
        }
    }, [token]);

    const handleAcceptInvite = async () => {
        try {
            // First, validate the token without requiring authentication
            const { data: inviteData, error: inviteError } = await supabase
                .from('event_staff_invitations')
                .select('*, events(title)')
                .eq('token', token)
                .single();

            if (inviteError || !inviteData) {
                console.error('Invite query error:', inviteError);
                setStatus('error');
                setMessage('Token undangan tidak valid.');
                return;
            }

            // TODO: Re-enable event end date check once we confirm events table has end_date field

            // Now check if user is authenticated
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // Not logged in - create staff session with token
                setStatus('unauthenticated');
                setMessage(`Silakan login atau buat akun untuk menerima undangan menjadi staff event "${inviteData.events?.title}".`);
                setEventId(inviteData.event_id);

                // Store staff token session in localStorage for passwordless access
                const staffSession = {
                    token: token,
                    eventId: inviteData.event_id,
                    email: inviteData.email,
                    eventTitle: inviteData.events?.title,
                    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
                };
                localStorage.setItem('staff_session', JSON.stringify(staffSession));

                // Redirect directly to event dashboard without login
                setTimeout(() => {
                    navigate(`/manage/event/${inviteData.event_id}`);
                }, 1500);

                setStatus('success');
                setMessage(`Selamat! Anda sekarang memiliki akses ke event "${inviteData.events?.title}" sebagai staff.`);
                return;
            }

            // User is logged in, proceed to accept the invite (create event_staff record)
            const { data, error } = await supabase.functions.invoke('accept-event-staff-invite', {
                body: { token }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            setStatus('success');
            setMessage('Selamat! Anda telah resmi menjadi staff event ini.');
            setEventId(data.eventId);

            // Redirect after delay
            setTimeout(() => {
                navigate(`/manage/event/${data.eventId}`);
            }, 3000);

        } catch (error) {
            console.error('Error accepting invite:', error);
            setStatus('error');
            setMessage(error.message || 'Terjadi kesalahan saat memproses undangan.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 text-center space-y-8 animate-in zoom-in-95 duration-500">
                {/* Brand */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-[#1a36c7] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <Layers size={20} className="text-white" />
                    </div>
                    <span className="text-xl font-black text-slate-900 uppercase tracking-tight">HeroesTix</span>
                </div>

                {/* Content based on Status */}
                {status === 'verifying' && (
                    <div className="space-y-6">
                        <Loader2 size={48} className="text-[#1a36c7] animate-spin mx-auto" />
                        <h2 className="text-xl font-bold text-slate-900">Memverifikasi Undangan...</h2>
                        <p className="text-slate-500 text-sm font-medium">Mohon tunggu sebentar.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border-4 border-green-100">
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Undangan Diterima!</h2>
                        <p className="text-slate-500 text-sm font-medium">{message}</p>
                        <button
                            onClick={() => navigate(`/manage/event/${eventId}`)}
                            className="w-full py-3 bg-[#1a36c7] text-white rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-[#152ba3] transition-all"
                        >
                            Masuk ke Dashboard Event
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6">
                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border-4 border-red-100">
                            <XCircle size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Gagal Menerima Undangan</h2>
                        <p className="text-slate-500 text-sm font-medium">{message}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-slate-800 transition-all"
                        >
                            Kembali ke Beranda
                        </button>
                    </div>
                )}

                {status === 'unauthenticated' && (
                    <div className="space-y-6">
                        <div className="w-16 h-16 bg-blue-50 text-[#1a36c7] rounded-full flex items-center justify-center mx-auto border-4 border-blue-100">
                            <Layers size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Login Diperlukan</h2>
                        <p className="text-slate-500 text-sm font-medium">{message}</p>
                        <div className="grid gap-3">
                            <button
                                onClick={() => navigate('/login', { state: { returnTo: `/accept-invite?token=${token}` } })}
                                className="w-full py-3 bg-[#1a36c7] text-white rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-[#152ba3] transition-all flex items-center justify-center gap-2"
                            >
                                Login Sekarang <ArrowRight size={16} />
                            </button>
                            <button
                                onClick={() => navigate('/register', { state: { returnTo: `/accept-invite?token=${token}` } })}
                                className="w-full py-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-slate-100 transition-all"
                            >
                                Buat Akun Baru
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AcceptInvite;
