
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

import {
    Users,
    Plus,
    Mail,
    Trash2,
    CheckCircle2,
    Clock,
    XCircle,
    Copy,
    Send,
    Link as LinkIcon,
    RefreshCw
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import useAuthStore from '../../auth/useAuthStore';
import { getBaseDomain, getSubdomainUrl } from '../../lib/navigation';

// Helper for invocation if not standard
const invokeFunction = async (name, body) => {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    // Using standard Supabase invoke
    const { data, error } = await supabase.functions.invoke(name, {
        body: body
    });
    if (error) throw error;
    return data;
};

const EventStaff = () => {
    const { id: eventId } = useParams();
    const { user } = useAuthStore();
    const [staffList, setStaffList] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteStatus, setInviteStatus] = useState(null); // success, error
    const [assistantToken, setAssistantToken] = useState(null);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);

    useEffect(() => {
        if (eventId) {
            fetchStaffData();
        }
    }, [eventId]);

    const fetchStaffData = async () => {
        setLoading(true);
        try {
            // Fetch Active Staff
            const { data: staffData, error: staffError } = await supabase
                .from('event_staffs')
                .select(`
                    id,
                    role,
                    created_at,
                    profiles:staff_id (
                        email,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('event_id', eventId);

            if (staffError) throw staffError;
            setStaffList(staffData || []);

            // Fetch Pending Invitations
            const { data: inviteData, error: inviteError } = await supabase
                .from('event_staff_invitations')
                .select('*')
                .eq('event_id', eventId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (inviteError) throw inviteError;
            setInvitations(inviteData || []);

            // Fetch Event Assistant Token
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('assistant_token')
                .eq('id', eventId)
                .single();

            if (!eventError && eventData) {
                setAssistantToken(eventData.assistant_token);
            }

        } catch (error) {
            console.error("Error fetching staff data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setIsInviting(true);
        setInviteStatus(null);

        console.log("Inviting staff:", { email: inviteEmail, eventId }); // DEBUG log

        try {
            const data = await invokeFunction('invite-event-staff', {
                email: inviteEmail,
                eventId: eventId
            });

            if (data && data.success === false) {
                throw new Error(data.error || 'Gagal mengirim undangan.');
            }

            setInviteStatus({ type: 'success', message: 'Undangan berhasil dikirim!' });
            setInviteEmail('');
            fetchStaffData(); // Refresh list to show pending invite
        } catch (error) {
            console.error("Invite error object:", error);
            if (error instanceof Error) {
                console.error("Error name:", error.name);
                console.error("Error message:", error.message);
                console.error("Error stack:", error.stack);
            }
            // Try to extract dynamic error message if available from Supabase function error
            let errorMessage = 'Gagal mengirim undangan.';
            if (error && error.message) {
                // Sometimes the message is a stringified JSON
                try {
                    const parsed = JSON.parse(error.message);
                    if (parsed.error) errorMessage = parsed.error;
                    else errorMessage = error.message;
                } catch (e) {
                    errorMessage = error.message;
                }
            }

            setInviteStatus({ type: 'error', message: errorMessage });
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveStaff = async (staffId) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus staff ini?")) return;

        try {
            const { error } = await supabase
                .from('event_staffs')
                .delete()
                .eq('id', staffId);

            if (error) throw error;
            fetchStaffData();
        } catch (error) {
            console.error("Error removing staff:", error);
            alert("Gagal menghapus staff.");
        }
    };

    const handleCancelInvite = async (inviteId) => {
        if (!window.confirm("Batalkan undangan ini?")) return;

        try {
            const { error } = await supabase
                .from('event_staff_invitations')
                .delete()
                .eq('id', inviteId);

            if (error) throw error;
            fetchStaffData();
        } catch (error) {
            console.error("Error canceling invite:", error);
        }
    };

    const handleGenerateToken = async () => {
        setIsGeneratingToken(true);
        try {
            const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const { error } = await supabase
                .from('events')
                .update({ assistant_token: newToken })
                .eq('id', eventId);

            if (error) throw error;
            setAssistantToken(newToken);
        } catch (error) {
            console.error("Error generating token:", error);
            alert("Gagal membuat link check-in.");
        } finally {
            setIsGeneratingToken(false);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Main Content Area */}
                <div className="lg:col-span-9 order-2 lg:order-1 space-y-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Undang Staff Baru</h3>
                            <p className="text-xs text-slate-400">Kirim undangan via email untuk memberikan akses manajemen event ini.</p>
                        </div>

                        <form onSubmit={handleInvite} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Staff</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="email"
                                        required
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="contoh@email.com"
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isInviting || !inviteEmail}
                                className="w-full py-3 bg-[#1a36c7] text-white rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-[#152ba3] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isInviting ? 'Mengirim...' : <><Send size={16} /> Kirim Undangan</>}
                            </button>
                        </form>

                        {inviteStatus && (
                            <div className={`p-4 rounded-xl border flex items-start gap-3 ${inviteStatus.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                {inviteStatus.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <XCircle size={18} className="shrink-0 mt-0.5" />}
                                <p className="text-xs font-medium">{inviteStatus.message}</p>
                            </div>
                        )}
                    </div>
                    {/* Pending Invitations moved down within main content */}
                    {invitations.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-5 bg-orange-500 rounded-full" />
                                <h3 className="text-lg font-bold text-slate-900">Undangan Pending</h3>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">{invitations.length}</span>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="divide-y divide-slate-50">
                                    {invitations.map((invite) => (
                                        <div key={invite.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                                                    <Mail size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{invite.email}</p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Clock size={12} /> Pending • {new Date(invite.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`https://heroestix.com/accept-invite?token=${invite.token}`);
                                                        alert("Link tersalin!");
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Salin Link Undangan"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleCancelInvite(invite.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Batalkan Undangan"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-5 bg-green-500 rounded-full" />
                            <h3 className="text-lg font-bold text-slate-900">Staff Aktif</h3>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">{staffList.length}</span>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {staffList.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {staffList.map((staff) => (
                                        <div key={staff.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                                                    {staff.profiles?.avatar_url ? (
                                                        <img src={staff.profiles.avatar_url} alt={staff.profiles.full_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        staff.profiles?.full_name?.charAt(0) || 'S'
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{staff.profiles?.full_name || 'Tanpa Nama'}</p>
                                                    <p className="text-xs text-slate-500">{staff.profiles?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                    {staff.role}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveStaff(staff.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-slate-400 text-sm">Belum ada staff aktif.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Sidebar */}
                <aside className="lg:col-span-3 order-1 lg:order-2 space-y-6 lg:sticky lg:top-6">
                    {/* Quick Access Card */}
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-5">
                        <div>
                            <h3 className="text-base font-black text-slate-900 tracking-tight border-b border-slate-100 pb-3">Link Check-In Cepat</h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed pt-3">Gunakan link ini untuk staff lapangan/volunteer agar bisa langsung melakukan check-in tanpa login.</p>
                        </div>

                        {!assistantToken ? (
                            <button
                                onClick={handleGenerateToken}
                                disabled={isGeneratingToken}
                                className="w-full py-3 bg-slate-100 text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                {isGeneratingToken ? 'Memproses...' : <><LinkIcon size={16} /> Buat Link Check-In</>}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                                    <p className="text-[10px] font-mono text-slate-400 break-all leading-relaxed">
                                        {`${getSubdomainUrl(null)}scan-tiket/${eventId}/${assistantToken}`}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${getSubdomainUrl(null)}scan-tiket/${eventId}/${assistantToken}`);
                                            alert("Link tersalin!");
                                        }}
                                        className="flex-1 py-2.5 bg-[#1a36c7] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                                    >
                                        <Copy size={14} /> Salin
                                    </button>
                                    <button
                                        onClick={handleGenerateToken}
                                        disabled={isGeneratingToken}
                                        className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:text-slate-600 transition-all active:rotate-180 duration-500"
                                        title="Reset Link"
                                    >
                                        <RefreshCw size={14} className={isGeneratingToken ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default EventStaff;
