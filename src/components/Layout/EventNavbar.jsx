import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiUser, FiLogOut } from "react-icons/fi";
import { MdOutlineContactSupport } from "react-icons/md";
import { HiOutlineInformationCircle } from "react-icons/hi";
import { supabase } from "../../lib/supabaseClient";

const EventNavbar = ({ searchTerm, setSearchTerm }) => {
    const [user, setUser] = useState(null);

    // Auth state
    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };

        getUser();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    // Logout
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    // ✅ DISPLAY NAME ONLY (NO EMAIL)
    const displayName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.username ||
        "User";

    return (
        <header
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 
                w-[95%] md:w-[98%] max-w-[1400px]
                transition-all duration-300 ease-in-out
                rounded-full border border-white/40 shadow-2xl shadow-blue-900/10
                backdrop-blur-md 
                py-3 bg-white/80 supports-[backdrop-filter]:bg-white/60"
        >
            <div className="px-8 md:px-12 flex items-center justify-between h-full">
                {/* Logo + Search */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Link to="/">
                        <img
                            src="/Logo/Logo.png"
                            alt="Logo"
                            className="h-9 w-auto cursor-pointer"
                        />
                    </Link>

                    <div className="relative w-full sm:w-64">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Heroestix <span className="text-blue-600">Official</span></h2>
                    </div>
                </div>

                {/* Menu Kanan */}
                <div className="ml-auto flex items-center gap-6 text-[13px] font-semibold uppercase tracking-wider text-slate-600">
                    <Link to="/about-us" className="hidden md:flex items-center gap-2 hover:text-blue-600 transition-colors">
                        <HiOutlineInformationCircle size={18} className="text-blue-500" />
                        Tentang Kami
                    </Link>

                    <Link to="/error" className="hidden md:flex items-center gap-2 hover:text-blue-600 transition-colors">
                        <MdOutlineContactSupport size={18} className="text-blue-500" />
                        Konsultasi
                    </Link>

                    {/* Auth */}
                    {user ? (
                        <div className="relative group">
                            <div className="flex items-center gap-2 cursor-pointer p-1 pr-4 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                                <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
                                    <FiUser size={16} className="text-blue-600" />
                                </div>
                                <span className="hidden sm:inline text-xs font-bold text-slate-700">{displayName}</span>
                            </div>

                            <div className="
                                absolute right-0 mt-4 w-52
                                rounded-[2rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100
                                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100
                                overflow-hidden p-2
                            ">
                                <div className="px-4 py-3 mb-2 bg-slate-50 rounded-2xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
                                    <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                                </div>

                                <div className="space-y-1">
                                    <Link
                                        to="/profile"
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded-xl font-medium normal-case"
                                    >
                                        <FiUser size={16} />
                                        <span>Profile</span>
                                    </Link>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors rounded-xl font-medium normal-case"
                                    >
                                        <FiLogOut size={16} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link to="/masuk" className="text-slate-600 hover:text-blue-600 hidden sm:block">
                                Masuk
                            </Link>

                            <Link
                                to="/daftar"
                                className="px-5 py-2 rounded-full font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5"
                            >
                                Daftar
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default EventNavbar;
