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
    HiOutlineShieldCheck
} from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");

    const [orders, setOrders] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

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
            // 1. Fetch Orders
            const { data: orderData } = await supabase
                .from("orders")
                .select(`
                    *,
                    tickets (
                        *,
                        ticket_types (
                            *,
                            events (*)
                        )
                    )
                `)
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            setOrders(orderData || []);

            // 2. Extract Tickets for easier access
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

    const rupiah = (value) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fdf5f2]">
                <div className="relative">
                    <div className="h-16 w-16 border-4 border-[#b1451a]/20 border-t-[#b1451a] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-2 w-2 bg-[#b1451a] rounded-full animate-ping"></div>
                    </div>
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
        <div className="min-h-screen bg-[#fdf5f2] selection:bg-[#b1451a]/10">
            <Navbar showSearch={false} />

            <div className="pt-32 pb-24 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                        {/* LEFT: PREMIUM SIDEBAR */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-4 xl:col-span-3 space-y-6"
                        >
                            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden relative group">
                                {/* Header Bg Accent */}
                                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-[#b1451a] to-[#d66a4a]" />

                                <div className="relative pt-10 px-6 pb-8 text-center">
                                    <div className="relative inline-block mb-4 group/avatar">
                                        <div className="absolute inset-0 bg-[#b1451a] rounded-full blur-lg opacity-20 group-hover/avatar:opacity-40 transition-opacity" />
                                        {user.user_metadata?.avatar_url ? (
                                            <img
                                                src={user.user_metadata.avatar_url}
                                                alt="Avatar"
                                                className="w-24 h-24 rounded-full object-cover border-4 border-white relative z-10 shadow-lg"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white relative z-10 shadow-lg flex items-center justify-center text-[#b1451a]">
                                                <HiUser className="text-5xl" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full z-20 shadow-sm" />
                                    </div>

                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                        {user.user_metadata?.nama || user.user_metadata?.full_name || "Member Hai-Ticket"}
                                    </h2>
                                    <p className="text-sm text-slate-400 font-medium">{user.email}</p>
                                </div>

                                <nav className="px-3 pb-6 space-y-2">
                                    {menuItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`w-full group/btn flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 relative ${activeTab === item.id
                                                ? "bg-slate-50 text-[#b1451a]"
                                                : "text-slate-500 hover:bg-slate-50/50"
                                                }`}
                                        >
                                            {activeTab === item.id && (
                                                <motion.div
                                                    layoutId="activeTabBg"
                                                    className="absolute left-0 w-1.5 h-8 bg-[#b1451a] rounded-full"
                                                />
                                            )}
                                            <div className={`text-2xl transition-transform duration-300 group-hover/btn:scale-110 ${activeTab === item.id ? "text-[#b1451a]" : "text-slate-400"
                                                }`}>
                                                {item.icon}
                                            </div>
                                            <div className="text-left">
                                                <p className={`text-[15px] font-bold leading-tight ${activeTab === item.id ? "text-slate-800" : "text-slate-600"
                                                    }`}>
                                                    {item.label}
                                                </p>
                                                <p className="text-[11px] text-slate-400 font-medium">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </button>
                                    ))}

                                    <div className="mx-4 my-6 border-t border-slate-100" />

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all duration-300 group/logout"
                                    >
                                        <div className="text-2xl group-hover/logout:translate-x-1 transition-transform">
                                            <HiLogout />
                                        </div>
                                        <span className="text-[15px] font-bold tracking-tight">Keluar Akun</span>
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
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.4 }}
                                        className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 p-10 h-full overflow-hidden relative"
                                    >
                                        {/* Background Decor */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#b1451a]/5 rounded-full blur-3xl -mr-32 -mt-32" />

                                        <div className="relative">
                                            <div className="mb-12 text-left">
                                                <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                                                    Informasi Akun
                                                </h1>
                                                <p className="text-slate-400 mt-2 font-medium">
                                                    Kelola data pribadi Anda untuk mempermudah proses pemesanan tiket.
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                                                <InfoField
                                                    icon={<HiUser className="text-[#b1451a]" />}
                                                    label="Nama Lengkap"
                                                    value={user.user_metadata?.nama || user.user_metadata?.full_name || "-"}
                                                />
                                                <InfoField
                                                    icon={<HiOutlineMail className="text-[#b1451a]" />}
                                                    label="Alamat Email"
                                                    value={user.email}
                                                />
                                                <InfoField
                                                    icon={<HiOutlineCalendar className="text-[#b1451a]" />}
                                                    label="Tanggal Lahir"
                                                    value={user.user_metadata?.tanggal_lahir || "-"}
                                                />
                                                <InfoField
                                                    icon={<HiOutlineShieldCheck className="text-[#b1451a]" />}
                                                    label="Metode Autentikasi"
                                                    value={user.app_metadata?.provider || "Email"}
                                                />
                                            </div>

                                            <div className="mt-16 bg-[#fdf5f2] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-[#b1451a]/5">
                                                <div className="text-center md:text-left">
                                                    <h3 className="font-black text-slate-800 text-lg">Keamanan Akun</h3>
                                                    <p className="text-sm text-slate-500 font-medium">Pastikan data Anda selalu terupdate dengan benar.</p>
                                                </div>
                                                <button className="whitespace-nowrap px-8 py-4 bg-[#b1451a] text-white rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-[#b1451a]/20 hover:bg-[#8e3715] transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                                                    Ubah Pengaturan
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === "tiket" && (
                                    <motion.div
                                        key="tiket"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 h-full min-h-[500px]"
                                    >
                                        {tickets.length > 0 ? (
                                            <div className="space-y-6">
                                                <div className="mb-8 text-left">
                                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Daftar Tiket Aktif</h2>
                                                    <p className="text-slate-400 font-medium text-sm">Berikut adalah tiket yang baru saja Anda beli.</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {tickets.map(ticket => (
                                                        <div key={ticket.id} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 relative overflow-hidden group hover:border-[#b1451a]/30 transition-all text-left">
                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#b1451a]/5 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
                                                            <div className="relative z-10 space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="px-3 py-1 bg-white rounded-full text-[10px] font-black uppercase text-[#b1451a] tracking-widest shadow-sm">
                                                                        {ticket.ticket_types?.name}
                                                                    </span>
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${ticket.order_status === 'paid' ? 'text-green-500' : 'text-orange-500'
                                                                        }`}>
                                                                        {ticket.order_status}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-black text-slate-800 line-clamp-1">{ticket.ticket_types?.events?.title}</h3>
                                                                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">{ticket.ticket_types?.events?.event_date}</p>
                                                                </div>
                                                                <div className="pt-4 border-t border-slate-200/50 flex items-center justify-between">
                                                                    <p className="text-[10px] font-mono text-slate-400">{ticket.qr_code}</p>
                                                                    <button className="text-[11px] font-black text-[#b1451a] uppercase tracking-widest hover:underline">Download</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center max-w-sm mx-auto">
                                                <div className="relative w-32 h-32 mx-auto mb-8">
                                                    <div className="absolute inset-0 bg-[#b1451a]/10 rounded-[2.5rem] rotate-12 scale-90" />
                                                    <div className="absolute inset-0 bg-[#b1451a]/5 rounded-[2.5rem] -rotate-6" />
                                                    <div className="relative w-full h-full bg-white rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center justify-center">
                                                        <HiTicket className="text-6xl text-[#b1451a]" />
                                                    </div>
                                                </div>
                                                <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Opps! Belum Ada Tiket</h2>
                                                <p className="text-slate-400 font-medium mb-10 leading-relaxed">
                                                    Sepertinya Anda belum memesan tiket apapun. Yuk, cari event menarik dan amankan tiketmu!
                                                </p>
                                                <button
                                                    onClick={() => navigate("/")}
                                                    className="w-full py-4 px-10 bg-gradient-to-r from-[#b1451a] to-[#d66a4a] text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-[#b1451a]/20 hover:opacity-90 transition-opacity"
                                                >
                                                    Cari Event Seru
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
                                        className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 h-full min-h-[500px]"
                                    >
                                        {orders.length > 0 ? (
                                            <div className="w-full space-y-6">
                                                <div className="mb-8 text-left">
                                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Riwayat Transaksi</h2>
                                                    <p className="text-slate-400 font-medium text-sm">Semua catatan transaksi pembayaran Anda.</p>
                                                </div>
                                                <div className="space-y-4">
                                                    {orders.map(order => (
                                                        <div key={order.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-slate-200 transition-all text-left">
                                                            <div className="flex items-center gap-6">
                                                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-[#b1451a]">
                                                                    <HiReceiptTax size={28} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-800">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                                                                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">
                                                                        {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-black text-slate-800">{rupiah(order.total)}</p>
                                                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${order.status === 'paid' ? 'text-green-500' : 'text-orange-500'
                                                                    }`}>
                                                                    {order.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center max-w-sm mx-auto">
                                                <div className="relative w-32 h-32 mx-auto mb-8">
                                                    <div className="absolute inset-0 bg-slate-100 rounded-full animate-pulse" />
                                                    <div className="relative w-full h-full flex items-center justify-center">
                                                        <HiReceiptTax className="text-6xl text-slate-300" />
                                                    </div>
                                                </div>
                                                <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Kosong Melompong</h2>
                                                <p className="text-slate-400 font-medium leading-relaxed">
                                                    Belum ada catatan transaksi yang dilakukan. Riwayat pembayaran Anda akan tampil di sini secara detail.
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoField = ({ label, value, icon }) => (
    <div className="relative group/field">
        <p className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">
            {icon}
            {label}
        </p>
        <div className="bg-slate-50/50 rounded-2xl px-6 py-4 border border-slate-100/80 group-hover/field:border-[#b1451a]/20 transition-colors">
            <span className="text-[15px] font-bold text-slate-800 tracking-tight">
                {value}
            </span>
        </div>
        <div className="absolute h-full w-1 left-0 top-0 bg-[#b1451a] rounded-full scale-y-0 group-hover/field:scale-y-50 transition-transform duration-300" />
    </div>
);

export default Profile;
