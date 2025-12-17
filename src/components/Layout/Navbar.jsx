import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiUser, FiLogOut } from "react-icons/fi";
import { MdOutlineContactSupport } from "react-icons/md";
import { HiOutlineInformationCircle } from "react-icons/hi";
import { supabase } from "../../supabaseClient";

const Navbar = ({ searchTerm, setSearchTerm }) => {
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState(null);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Handle auth state
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

    // Display name (username > email)
    const displayName =
        user?.user_metadata?.username ||
        user?.email ||
        "User";

    return (
        <header
            className={`
                fixed z-50 transition-all duration-300
                ${scrolled
                    ? "top-0 left-0 w-full"
                    : "top-6 left-1/2 -translate-x-1/2 w-full max-w-7xl px-4"
                }
            `}
        >
            <div
                className={`
                    flex items-center gap-6 transition-all duration-300 ease-in-out
                    ${scrolled
                        ? "rounded-none px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-400 shadow-md"
                        : "rounded-2xl px-6 py-4 bg-white shadow-xl"
                    }
                `}
            >
                {/* 🔵 Logo + Search */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Link to="/">
                        <img
                            src={scrolled ? "/Logo/LogoLight.png" : "/Logo/LogoDark.png"}
                            alt="Logo"
                            className="h-10 w-auto cursor-pointer transition-all duration-300"
                        />
                    </Link>

                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Cari event..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`
                                w-full pl-10 pr-4 py-2 rounded-xl transition
                                focus:outline-none focus:ring-2
                                ${scrolled
                                    ? "border border-white/40 bg-blue-600 text-white placeholder-white focus:ring-white"
                                    : "border border-black bg-white/90 text-black placeholder-gray-500 focus:ring-blue-500"
                                }
                            `}
                        />
                        <FiSearch
                            className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${scrolled ? "text-white" : "text-black"
                                }`}
                        />
                    </div>
                </div>

                {/* 🔵 Menu Kanan */}
                <div
                    className={`ml-auto flex items-center gap-6 text-sm font-medium ${scrolled ? "text-white" : "text-black"
                        }`}
                >
                    <Link to="/about-us" className="flex items-center gap-2 hover:opacity-80">
                        <HiOutlineInformationCircle size={18} />
                        Tentang Kami
                    </Link>

                    <Link to="/error" className="flex items-center gap-2 hover:opacity-80">
                        <MdOutlineContactSupport size={18} />
                        Konsultasi
                    </Link>

                    {/* 🔵 Auth Section */}
                    {user ? (
                        <div className="relative group">
                            {/* Trigger */}
                            <div
                                className="
                                    flex items-center gap-2 cursor-pointer font-semibold
                                    transition-all duration-300
                                    hover:text-blue-500
                                "
                            >
                                <FiUser size={18} />
                                {displayName}
                            </div>

                            {/* Dropdown */}
                            <div
                                className="
                                    absolute right-0 mt-3 w-40
                                    rounded-xl bg-white shadow-xl
                                    opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                    transition-all duration-300
                                    text-black
                                "
                            >
                                <Link
                                    to="/profile"
                                    className="
                                        flex items-center gap-2 px-4 py-3
                                        hover:bg-blue-50 rounded-t-xl
                                    "
                                >
                                    <FiUser size={16} />
                                    Profile
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="
                                        w-full flex items-center gap-2 px-4 py-3
                                        hover:bg-red-50 text-red-600
                                        rounded-b-xl
                                    "
                                >
                                    <FiLogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link
                                to="/masuk"
                                className="
                                    transition-all duration-300
                                    hover:text-blue-500
                                    hover:drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]
                                "
                            >
                                Masuk
                            </Link>

                            <Link
                                to="/daftar"
                                className={`
                                    px-4 py-2 rounded-xl font-semibold transition-all duration-300
                                    ${scrolled
                                        ? "bg-white text-blue-600 hover:bg-blue-50"
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                    }
                                    hover:shadow-[0_0_12px_rgba(59,130,246,0.9)]
                                `}
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

export default Navbar;
