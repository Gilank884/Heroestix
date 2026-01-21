import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiUser, FiLogOut } from "react-icons/fi";
import { supabase } from "../../lib/supabaseClient";

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState(null);

    // Scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

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

    const displayName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.username ||
        "User";

    const navLinks = [
        { name: "Become a Creator", path: "/become-creator" },
        { name: "About Us", path: "/about-us" },
        { name: "Contact Us", path: "/contact" }
    ];

    return (
        <header
            className={`
                fixed top-6 left-1/2 -translate-x-1/2 w-[95%] md:w-[90%] max-w-7xl z-50 
                transition-all duration-500 ease-in-out
                ${scrolled ? "py-3 bg-[#5d3a24]/95 backdrop-blur-md" : "py-4 bg-[#5d3a24]"}
                shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-xl border border-white/5
                hover:border-white/20 hover:bg-[#5d3a24] hover:shadow-[0_30px_70px_rgba(0,0,0,0.3)]
            `}
        >
            <div className="mx-auto px-6 md:px-10 flex items-center justify-between">
                {/* Logo Section */}
                <div className="flex items-center gap-10">
                    <Link to="/" className="flex-shrink-0 flex items-center gap-3 group/logo">
                        <img
                            src="/Logo/Logo.png"
                            alt="Heroestix Logo"
                            className="h-9 w-auto transition-transform duration-500 group-hover/logo:scale-110"
                        />
                        <span className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase italic group-hover/logo:text-orange-400 transition-colors duration-500">
                            Heroestix
                        </span>
                    </Link>

                </div>

                {/* Right Side: Navigation + Auth / CTA */}
                <div className="flex items-center gap-10">
                    {/* Navigation Menu - Desktop */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`
                                    text-[13px] font-black uppercase tracking-widest transition-all hover:text-orange-400
                                    text-white/80
                                `}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                    {user ? (
                        <div className="relative group">
                            <div className={`
                                flex items-center gap-2 cursor-pointer font-semibold hover:text-orange-400 transition-all
                                text-white
                            `}>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                    <FiUser size={16} className="text-orange-400" />
                                </div>
                                <span className="hidden sm:inline text-sm">{displayName}</span>
                            </div>

                            {/* Dropdown Menu */}
                            <div className="
                                absolute right-0 mt-4 w-48
                                rounded-2xl bg-[#4a2e1d] shadow-2xl ring-1 ring-white/10
                                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100
                                overflow-hidden text-white/90
                            ">
                                <Link
                                    to="/profile"
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                                >
                                    <FiUser size={16} />
                                    <span>Profile</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-red-400 transition-colors border-t border-white/5"
                                >
                                    <FiLogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                to="/masuk"
                                className="
                                    px-6 py-2.5 rounded-xl font-bold text-sm
                                    bg-[#b1451a] text-white shadow-lg shadow-orange-900/20
                                    hover:bg-[#8e3715] hover:scale-105 active:scale-95 transition-all
                                "
                            >
                                Get In
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
