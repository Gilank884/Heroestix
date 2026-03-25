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
    RefreshCw,
    Shield,
    UserCheck,
    UserPlus,
    Layout,
    ArrowRight,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../auth/useAuthStore';
import { getSubdomainUrl } from '../../lib/navigation';

// Helper for invocation if not standard
const invokeFunction = async (name, body) => {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

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

    const AVAILABLE_MODULES = [
        "Detail Event", "Kategori Tiket", "Voucher", "Staff",
        "Formulir Tambahan", "Laporan Penjualan", "Penarikan Saldo",
        "Daftar Pengunjung", "Statistik Check-in", "Proses Check-in"
    ];

    const [selectedModules, setSelectedModules] = useState(AVAILABLE_MODULES);

    const toggleModule = (moduleName) => {
        setSelectedModules(prev =>
            prev.includes(moduleName)
                ? prev.filter(m => m !== moduleName)
                : [...prev, moduleName]
        );
    };

    useEffect(() => {
        if (eventId) {
            fetchStaffData();
        }
    }, [eventId]);

    const fetchStaffData = async () => {
        setLoading(true);
        try {
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

            const { data: inviteData, error: inviteError } = await supabase
                .from('event_staff_invitations')
                .select('*')
                .eq('event_id', eventId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            const activeEmails = (staffData || []).map(s => s.profiles?.email).filter(Boolean);
            const pendingInvites = (inviteData || []).filter(inv => !activeEmails.includes(inv.email));
            setInvitations(pendingInvites);

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

        try {
            const data = await invokeFunction('invite-event-staff', {
                email: inviteEmail,
                eventId: eventId,
                accessModules: selectedModules
            });

            if (data && data.success === false) {
                throw new Error(data.error || 'Gagal mengirim undangan.');
            }

            setInviteStatus({ type: 'success', message: 'Undangan berhasil dikirim!' });
            setInviteEmail('');
            setSelectedModules(AVAILABLE_MODULES);
            fetchStaffData();
            setTimeout(() => setInviteStatus(null), 5000);
        } catch (error) {
            let errorMessage = 'Gagal mengirim undangan.';
            if (error && error.message) {
                try {
                    const parsed = JSON.parse(error.message);
                    errorMessage = parsed.error || error.message;
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
        } finally {
            setIsGeneratingToken(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
    };

    if (loading) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-6 min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Users size={20} className="text-blue-600 animate-pulse" />
                    </div>
                </div>
                <div className="space-y-1 text-center">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] block">TEAM MANAGEMENT</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Memuat daftar kolaborator...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pb-20">

            <motion.div
                className="relative z-10 space-y-12"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Unified Header Card with Stats */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-200">
                                    Collaborations
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Management Team</span>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 leading-none">
                                    Manajemen Staff <Shield className="text-blue-600" size={32} />
                                </h1>
                                <p className="text-slate-500 font-medium text-sm mt-3 max-w-xl leading-relaxed">
                                    Kelola otorisasi tim Anda. Undang kolaborator, atur modul aksesibilitas, dan pantau aktivitas staff operasional secara terpusat.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Team Statistics</span>
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-3">
                                        {[...Array(Math.min(3, staffList.length))].map((_, i) => (
                                            <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm overflow-hidden">
                                                {staffList[i]?.profiles?.avatar_url ? (
                                                    <img src={staffList[i].profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    staffList[i]?.profiles?.full_name?.charAt(0) || 'S'
                                                )}
                                            </div>
                                        ))}
                                        {staffList.length > 3 && (
                                            <div className="w-9 h-9 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg relative z-10">
                                                +{staffList.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-10 w-px bg-slate-100 mx-2" />
                                    <div className="space-y-0.5">
                                        <p className="text-lg font-black text-slate-900 leading-none">{staffList.length + invitations.length}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Squad</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Management Section (Full Width) */}
                <div className="space-y-12 max-w-6xl">
                    {/* Invite Form Card */}
                    <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/40 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">Undang Staff Baru</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-1">Integrasikan email kolaborator ke sistem</p>
                            </div>
                        </div>

                        <form onSubmit={handleInvite} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Kolaborator</label>
                                    <div className="relative">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="contoh@email.com"
                                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-300 shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delegasi Akses Modul</label>
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[8px] font-black uppercase tracking-tighter">
                                            {selectedModules.length} Terpilih
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedModules(selectedModules.length === AVAILABLE_MODULES.length ? [] : AVAILABLE_MODULES)}
                                        className="text-[10px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                                    >
                                        {selectedModules.length === AVAILABLE_MODULES.length ? 'Bersihkan Semua' : 'Otorisasi Semua'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {AVAILABLE_MODULES.map((module) => (
                                        <motion.button
                                            key={module}
                                            type="button"
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => toggleModule(module)}
                                            className={`
                                                flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left
                                                ${selectedModules.includes(module)
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                                                    : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}
                                            `}
                                        >
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${selectedModules.includes(module) ? 'bg-white' : 'bg-slate-100 shadow-inner'}`}>
                                                <CheckCircle2 size={12} className={selectedModules.includes(module) ? 'text-blue-600' : 'text-slate-300'} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-tight truncate">{module}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={isInviting || !inviteEmail}
                                whileHover={!isInviting ? { scale: 1.02 } : {}}
                                whileTap={!isInviting ? { scale: 0.98 } : {}}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
                            >
                                {isInviting ? (
                                    <><Activity size={18} className="animate-spin" /> Mengirim Otorisasi...</>
                                ) : (
                                    <>Kirim Undangan Akses <Send size={16} className="group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </motion.button>
                        </form>

                        <AnimatePresence>
                            {inviteStatus && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    className={`p-5 rounded-2xl border flex items-center gap-4 transition-all ${inviteStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${inviteStatus.type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                                        {inviteStatus.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest">{inviteStatus.message}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Pending Invitations Table */}
                    <AnimatePresence>
                        {invitations.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-3 px-2">
                                    <div className="w-1.5 h-6 bg-amber-500 rounded-full shadow-lg shadow-amber-200" />
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Menunggu Konfirmasi</h3>
                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black">{invitations.length}</span>
                                </div>

                                <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white shadow-xl shadow-slate-200/40 overflow-hidden text-left">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/30">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Undangan (Email)</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden md:table-cell text-center">Tanggal Kirim</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {invitations.map((invite) => (
                                                <motion.tr
                                                    key={invite.id}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="group hover:bg-slate-50/50 transition-colors"
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner shrink-0 leading-none">
                                                                <Mail size={16} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-slate-900 text-sm truncate">{invite.email}</p>
                                                                <span className="md:hidden text-[9px] font-bold text-amber-500/80 uppercase tracking-widest block mt-0.5">{new Date(invite.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 hidden md:table-cell text-center">
                                                        <p className="text-xs font-bold text-slate-500 tabular-nums uppercase">{new Date(invite.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(`https://heroestix.com/accept-invite?token=${invite.token}`);
                                                                    alert("Link tersalin!");
                                                                }}
                                                                className="p-2.5 bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-blue-600 rounded-xl hover:shadow-md transition-all active:scale-95"
                                                                title="Salin Link"
                                                            >
                                                                <Copy size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancelInvite(invite.id)}
                                                                className="p-2.5 bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-rose-600 rounded-xl hover:shadow-md transition-all active:scale-95"
                                                                title="Batalkan"
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Active Staff List Table */}
                    <motion.div variants={itemVariants} className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-lg shadow-emerald-200" />
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Staff Operasional</h3>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black">{staffList.length}</span>
                        </div>

                        <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white shadow-xl shadow-slate-200/40 overflow-hidden text-left">
                            {staffList.length > 0 ? (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/30">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profil Staff</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden md:table-cell text-center">Hak Akses (Role)</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status & Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {staffList.map((staff) => (
                                            <motion.tr
                                                key={staff.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="group hover:bg-slate-50/50 transition-colors"
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm overflow-hidden shadow-inner border border-white relative shrink-0">
                                                            {staff.profiles?.avatar_url ? (
                                                                <img src={staff.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                staff.profiles?.full_name?.charAt(0) || 'S'
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-900 text-sm truncate leading-tight uppercase tracking-tight">{staff.profiles?.full_name || 'Staff'}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">{staff.profiles?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 hidden md:table-cell text-center">
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-[0.15em] shadow-sm">
                                                        {staff.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveStaff(staff.id)}
                                                            className="p-2.5 bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 hover:shadow-md transition-all active:scale-95"
                                                            title="Lepas Jabatan"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                                        <UserCheck size={32} />
                                    </div>
                                    <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">Katalog Staff Kosong</h4>
                                    <p className="text-slate-400 text-[10px] font-bold mt-2 max-w-[180px] mx-auto uppercase tracking-widest text-center leading-relaxed">Undang kolaborator pertama untuk memberikan kewenangan operasional.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default EventStaff;
