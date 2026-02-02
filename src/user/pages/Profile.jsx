import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import Navbar from "../../components/Layout/Navbar";
import {
    HiUser,
    HiTicket,
    HiReceiptTax,
    HiLogout,
    HiChevronRight,
    HiOutlineMail,
    HiOutlineCalendar,
    HiOutlineShieldCheck,
    HiTrash,
    HiExclamation
} from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");

    const [orders, setOrders] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (!data.user) {
                navigate("/masuk");
                return;
            }
            setUser(data.user);
            setLoading(false);
            fetchUserData(data.user.id);
        };
        getUser();
    }, [navigate]);

    const fetchUserData = async (userId) => {
        setLoadingData(true);
        try {
            // 1. Fetch Profile from public.profiles
            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();
            setProfile(profileData);

            // 2. Fetch Orders with Tickets & Event details
            const { data: orderData } = await supabase
                .from("orders")
                .select(`
                    *,
                    tickets (
                        id,
                        qr_code,
                        status,
                        ticket_types (
                            id,
                            name,
                            price,
                            events (
                                id,
                                title,
                                event_date,
                                event_time,
                                location,
                                poster_url
                            )
                        )
                    )
                `)
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            setOrders(orderData || []);

            // 3. Extract Tickets for "Tiket Saya"
            const allTickets = [];
            orderData?.forEach(order => {
                order.tickets?.forEach(ticket => {
                    allTickets.push({
                        ...ticket,
                        order_status: order.status,
                        order_date: order.created_at
                    });
                });
            });
            setTickets(allTickets);

            // 4. Fetch Transactions for "Riwayat Transaksi"
            // Since transactions are linked to order_id, we fetch transactions where order_id belongs to the user
            const orderIds = orderData?.map(o => o.id) || [];
            if (orderIds.length > 0) {
                const { data: transData } = await supabase
                    .from("transactions")
                    .select("*, orders(total, status)")
                    .in("order_id", orderIds)
                    .order("created_at", { ascending: false });
                setTransactions(transData || []);
            }

        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) navigate("/");
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            // 1. Delete user from auth.users via RPC
            const { error: rpcError } = await supabase.rpc('delete_user_auth');

            if (rpcError) {
                console.error("RPC deletion failed:", rpcError);
                alert("Gagal menghapus data otentikasi (RPC Error). Silakan pastikan Anda telah menjalankan kode SQL di Dashboard Supabase untuk mengaktifkan fitur ini.");

                // Fallback: just delete the profile record
                await supabase
                    .from("profiles")
                    .delete()
                    .eq("id", user.id);
            }

            // 2. Log out
            await supabase.auth.signOut();
            alert("Proses penghapusan akun selesai. Jika RPC berhasil, Anda dapat mendaftar ulang.");
            navigate("/");
        } catch (error) {
            console.error("Error deleting account:", error);
            alert("Gagal menghapus akun. Silakan coba lagi nanti.");
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
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
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Profil...</span>
                </div>
            </div>
        );
    }

    const menuItems = [
        { id: "profile", label: "Informasi Profil", icon: <HiUser />, desc: "Detail akun & keamanan" },
        { id: "tiket", label: "Tiket Saya", icon: <HiTicket />, desc: "Daftar tiket aktif" },
        { id: "transaksi", label: "Riwayat Transaksi", icon: <HiReceiptTax />, desc: "Catatan pembayaran" },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar showSearch={false} />

            <div className="pt-32 pb-24 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* LEFT: PROFESSIONAL SIDEBAR */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-4 xl:col-span-3"
                        >
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden sticky top-28">
                                <div className="p-8 text-center border-b border-slate-100 bg-slate-50/50">
                                    <div className="relative inline-block mb-4 group/avatar">
                                        <div className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-white relative z-10 shadow-sm flex items-center justify-center text-blue-600 overflow-hidden">
                                            {(profile?.avatar_url || user?.user_metadata?.avatar_url) ? (
                                                <img
                                                    src={profile?.avatar_url || user.user_metadata.avatar_url}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'block';
                                                    }}
                                                />
                                            ) : null}
                                            <HiUser
                                                size={40}
                                                style={{ display: (profile?.avatar_url || user?.user_metadata?.avatar_url) ? 'none' : 'block' }}
                                            />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full z-20" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                                        {profile?.full_name || user?.user_metadata?.nama || user?.user_metadata?.full_name || "Member Heroestix"}
                                    </h2>
                                    <p className="text-xs text-slate-400 font-semibold mt-1">{user?.email}</p>
                                </div>

                                <nav className="p-3 space-y-1">
                                    {menuItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`w-full flex items-center gap-3.5 p-3 rounded-xl transition-all duration-200 group/btn ${activeTab === item.id
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                                }`}
                                        >
                                            <div className={`text-xl transition-transform duration-300 group-hover/btn:scale-110 ${activeTab === item.id ? "text-white" : "text-slate-400"
                                                }`}>
                                                {item.icon}
                                            </div>
                                            <div className="text-left">
                                                <p className={`text-sm font-bold leading-none ${activeTab === item.id ? "text-white" : "text-slate-800"
                                                    }`}>
                                                    {item.label}
                                                </p>
                                            </div>
                                        </button>
                                    ))}

                                    <div className="my-3 border-t border-slate-100" />

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3.5 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200 group/logout"
                                    >
                                        <div className="text-xl group-hover/logout:-translate-x-0.5 transition-transform">
                                            <HiLogout />
                                        </div>
                                        <span className="text-sm font-bold">Keluar Akun</span>
                                    </button>
                                </nav>
                            </div>
                        </motion.div>

                        {/* RIGHT: CONTENT PANEL */}
                        <div className="lg:col-span-8 xl:col-span-9">
                            <AnimatePresence mode="wait">
                                {activeTab === "profile" && (
                                    <motion.div
                                        key="profile"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10"
                                    >
                                        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Personal</h1>
                                                <p className="text-sm text-slate-400 mt-1 font-medium">Informasi identitas dan keamanan akun Anda.</p>
                                            </div>
                                            <button className="px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl font-bold text-xs hover:border-blue-600 hover:text-blue-600 transition-all">
                                                Edit Profil
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <InfoField
                                                icon={<HiUser size={18} />}
                                                label="Nama Lengkap"
                                                value={profile?.full_name || user?.user_metadata?.nama || user?.user_metadata?.full_name || "-"}
                                            />
                                            <InfoField
                                                icon={<HiOutlineMail size={18} />}
                                                label="Alamat Email"
                                                value={profile?.email || user?.email}
                                            />
                                            <InfoField
                                                icon={<HiOutlineCalendar size={18} />}
                                                label="Tanggal Lahir"
                                                value={user?.user_metadata?.tanggal_lahir || "-"}
                                            />
                                            <InfoField
                                                icon={<HiOutlineShieldCheck size={18} />}
                                                label="Role Akun"
                                                value={profile?.role?.toUpperCase() || "USER"}
                                            />
                                        </div>

                                        <div className="mt-12 bg-blue-600 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                                <div className="text-center md:text-left">
                                                    <h3 className="font-bold text-lg">Keamanan Identitas</h3>
                                                    <p className="text-sm text-blue-100 mt-1">Gunakan verifikasi dua langkah untuk perlindungan maksimal.</p>
                                                </div>
                                                <button className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                                    Aktifkan 2FA
                                                </button>
                                            </div>
                                        </div>

                                        {/* DANGER ZONE */}
                                        <div className="mt-12 border-t border-slate-100 pt-10">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                                                    <HiExclamation size={20} />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900">Zona Bahaya</h3>
                                            </div>
                                            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                                <div>
                                                    <p className="text-sm font-bold text-red-900">Hapus Akun Permanen</p>
                                                    <p className="text-xs text-red-600/70 mt-1 font-medium">Seluruh data tiket, transaksi, dan akun Anda akan dihapus permanen.</p>
                                                </div>
                                                <button
                                                    onClick={() => setShowDeleteModal(true)}
                                                    className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-red-200 hover:bg-red-700 transition-all whitespace-nowrap"
                                                >
                                                    Hapus Akun
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === "tiket" && (
                                    <motion.div
                                        key="tiket"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 h-full min-h-[500px]"
                                    >
                                        <div className="mb-10">
                                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Tiket Saya</h2>
                                            <p className="text-sm text-slate-400 mt-1 font-medium">Tiket aktif untuk event yang akan datang.</p>
                                        </div>

                                        {tickets.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                {tickets.map(ticket => (
                                                    <div key={ticket.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:border-blue-600/30 transition-all group">
                                                        <div className="flex flex-col gap-4">
                                                            <div className="flex items-center justify-between">
                                                                <span className="px-2.5 py-1 bg-white border border-slate-200 text-[10px] font-bold text-slate-500 rounded-md uppercase">
                                                                    {ticket.ticket_types?.name}
                                                                </span>
                                                                <span className={`text-[10px] font-bold uppercase ${ticket.order_status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                                                                    {ticket.order_status}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{ticket.ticket_types?.events?.title}</h3>
                                                                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{ticket.ticket_types?.events?.event_date}</p>
                                                            </div>
                                                            <div className="pt-3 border-t border-slate-200/50 flex items-center justify-between">
                                                                <p className="text-[10px] font-mono text-slate-400">{ticket.qr_code}</p>
                                                                <button className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Detail E-Tiket</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-6">
                                                    <HiTicket size={40} />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-2">Belum Memiliki Tiket</h3>
                                                <p className="text-sm text-slate-400 max-w-xs mx-auto mb-8 font-medium leading-relaxed">
                                                    Sepertinya Anda belum memiliki tiket aktif. Mari jelajahi event menarik lainnya.
                                                </p>
                                                <button
                                                    onClick={() => navigate("/")}
                                                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                >
                                                    Jelajahi Event
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === "transaksi" && (
                                    <motion.div
                                        key="transaksi"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-10 h-full min-h-[500px]"
                                    >
                                        <div className="mb-10">
                                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Riwayat Transaksi</h2>
                                            <p className="text-sm text-slate-400 mt-1 font-medium">Catatan lengkap seluruh pembelian tiket Anda.</p>
                                        </div>

                                        {transactions.length > 0 ? (
                                            <div className="space-y-3">
                                                {transactions.map(transaction => (
                                                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-xl hover:border-slate-200 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                                                                <HiReceiptTax size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900">Order #{transaction.order_id.slice(0, 6).toUpperCase()}</p>
                                                                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                                                                    {transaction.method} • {new Date(transaction.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-slate-900">{rupiah(transaction.amount)}</p>
                                                            <span className={`text-[10px] font-bold uppercase ${transaction.status === 'success' ? 'text-green-600' : 'text-orange-500'}`}>
                                                                {transaction.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-6">
                                                    <HiReceiptTax size={40} />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-2">Riwayat Kosong</h3>
                                                <p className="text-sm text-slate-400 font-medium">Anda belum melakukan transaksi pembayaran.</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* DELETE ACCOUNT MODAL */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !deleting && setShowDeleteModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10"
                        >
                            <div className="p-8 text-center text-slate-900">
                                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                                    <HiTrash size={32} />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight mb-2">Hapus Akun Permanen?</h3>
                                <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                                    Tindakan ini tidak dapat dibatalkan. Seluruh riwayat tiket dan transaksi Anda akan hilang selamanya.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        disabled={deleting}
                                        onClick={() => setShowDeleteModal(false)}
                                        className="py-3.5 px-4 bg-slate-100 text-slate-900 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        disabled={deleting}
                                        onClick={handleDeleteAccount}
                                        className="py-3.5 px-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {deleting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                <span>Menghapus...</span>
                                            </>
                                        ) : (
                                            "Ya, Hapus"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const InfoField = ({ label, value, icon }) => (
    <div className="group/field">
        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-0.5">
            {icon}
            {label}
        </label>
        <div className="bg-slate-50/50 rounded-xl px-5 py-3 border border-slate-200 group-hover/field:border-blue-600/30 transition-colors">
            <span className="text-sm font-bold text-slate-900">
                {value}
            </span>
        </div>
    </div>
);

export default Profile;
