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
        <header className="fixed z-50 transition-all duration-300 top-0 left-0 w-full py-3 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
            <div className="flex items-center gap-10 max-w-7xl mx-auto px-6 md:px-10">
                {/* Logo + Search */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Link to="/">
                        <img
                            src="/Logo/Logo.png"
                            alt="Logo"
                            className="h-10 w-auto cursor-pointer"
                        />
                    </Link>

                    <div className="relative w-full sm:w-64">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Heroestix <span className="text-blue-600">Official</span></h2>
                    </div>
                </div>

                {/* Menu Kanan */}
                <div className="ml-auto flex items-center gap-8 text-[13px] font-semibold uppercase tracking-wider text-slate-600">
                    <Link to="/about-us" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                        <HiOutlineInformationCircle size={18} className="text-blue-500" />
                        Tentang Kami
                    </Link>

                    <Link to="/error" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                        <MdOutlineContactSupport size={18} className="text-blue-500" />
                        Konsultasi
                    </Link>

                    {/* Auth */}
                    {user ? (
                        <div className="relative group">
                            <div className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 hover:text-blue-600">
                                <FiUser size={18} className="text-blue-600" />
                                {displayName}
                            </div>

                            <div className="
                                absolute right-0 mt-3 w-40
                                rounded-xl bg-white shadow-xl
                                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                transition-all duration-300
                                text-black
                            ">
                                <Link
                                    to="/profile"
                                    className="flex items-center gap-2 px-4 py-3 hover:bg-[#f9e2d2] rounded-t-xl"
                                >
                                    <FiUser size={16} />
                                    Profile
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 text-red-600 rounded-b-xl"
                                >
                                    <FiLogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/masuk" className="text-slate-600 hover:text-blue-600">
                                Masuk
                            </Link>

                            <Link
                                to="/daftar"
                                className="px-5 py-2 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
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
