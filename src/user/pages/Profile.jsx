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
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");

    const [orders, setOrders] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");


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
                        order_id: order.id,
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
                                        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Tiket Saya</h2>
                                                <p className="text-sm text-slate-400 mt-1 font-medium">Tiket aktif untuk event yang akan datang.</p>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Cari event atau tiket..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full md:w-64 transition-all"
                                                />
                                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>

                                        {tickets.filter(ticket =>
                                            ticket.ticket_types?.events?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            ticket.ticket_types?.name.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).length > 0 ? (
                                            <div className="space-y-3">
                                                {tickets.filter(ticket =>
                                                    ticket.ticket_types?.events?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    ticket.ticket_types?.name.toLowerCase().includes(searchTerm.toLowerCase())
                                                ).map(ticket => (
                                                    <div
                                                        key={ticket.id}
                                                        onClick={() => navigate(`/transaction-detail/${ticket.order_id}`)}
                                                        className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-xl hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                                                                <HiTicket size={24} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h3 className="font-bold text-slate-900 text-sm truncate pr-4">{ticket.ticket_types?.events?.title}</h3>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="px-2 py-0.5 bg-white border border-slate-200 text-[10px] font-bold text-slate-500 rounded uppercase">
                                                                        {ticket.ticket_types?.name}
                                                                    </span>
                                                                    <span className="text-[11px] text-slate-400 font-medium truncate">
                                                                        • {ticket.ticket_types?.events?.event_date}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${ticket.order_status === 'paid'
                                                                ? 'bg-green-50 text-green-600 border-green-100'
                                                                : 'bg-orange-50 text-orange-600 border-orange-100'
                                                                }`}>
                                                                {ticket.order_status}
                                                            </span>
                                                            <div className="mt-1.5 text-slate-300 group-hover:text-blue-600 transition-colors">
                                                                <HiChevronRight size={16} className="ml-auto" />
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
