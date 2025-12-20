import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiUser, FiLogOut } from "react-icons/fi";
import { MdOutlineContactSupport } from "react-icons/md";
import { HiOutlineInformationCircle } from "react-icons/hi";
import { supabase } from "../../supabaseClient";

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
        <header className="fixed z-50 transition-all duration-300 top-0 left-0 w-full">
            <div className="flex items-center gap-6 transition-all duration-300 rounded-none px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-400 shadow-md">
                {/* Logo + Search */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Link to="/">
                        <img
                            src="/Logo/LogoLight.png"
                            alt="Logo"
                            className="h-10 w-auto cursor-pointer"
                        />
                    </Link>

                    <div className="relative w-full sm:w-64">
                        <h2 className="text-2xl font-black text-white tracking-tight">Hai Ticket Official</h2>
                    </div>
                </div>

                {/* Menu Kanan */}
                <div className="ml-auto flex items-center gap-6 text-sm font-medium text-white">
                    <Link to="/about-us" className="flex items-center gap-2 hover:opacity-80">
                        <HiOutlineInformationCircle size={18} />
                        Tentang Kami
                    </Link>

                    <Link to="/error" className="flex items-center gap-2 hover:opacity-80">
                        <MdOutlineContactSupport size={18} />
                        Konsultasi
                    </Link>

                    {/* Auth */}
                    {user ? (
                        <div className="relative group">
                            <div className="flex items-center gap-2 cursor-pointer font-semibold hover:text-white/80">
                                <FiUser size={18} />
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
                                    className="flex items-center gap-2 px-4 py-3 hover:bg-blue-50 rounded-t-xl"
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
                            <Link to="/masuk" className="hover:text-white/80">
                                Masuk
                            </Link>

                            <Link
                                to="/daftar"
                                className="px-4 py-2 rounded-xl font-semibold bg-white text-blue-600 hover:bg-blue-50"
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
