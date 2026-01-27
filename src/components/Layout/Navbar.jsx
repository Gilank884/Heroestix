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
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();
                setUser({ ...user, role: profile?.role });
            }
        };

        getUser();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("role")
                        .eq("id", session.user.id)
                        .single();
                    setUser({ ...session.user, role: profile?.role });
                } else {
                    setUser(null);
                }
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
                fixed top-0 left-0 w-full z-50 
                transition-all duration-300 ease-in-out
                ${scrolled
                    ? "py-3 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm"
                    : "py-5 bg-transparent"}
            `}
        >
            <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
                {/* Logo Section - Professional Blue */}
                <div className="flex items-center gap-10">
                    <Link to="/" className="flex-shrink-0 flex items-center gap-3 group/logo">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center transform group-hover/logo:rotate-6 transition-transform duration-300">
                            <img
                                src="/Logo/Logo.png"
                                alt="Heroestix Logo"
                                className="h-6 w-auto brightness-0 invert"
                            />
                        </div>
                        <span className={`text-2xl font-bold tracking-tight ${scrolled ? "text-slate-900" : "text-white"} transition-colors duration-300`}>
                            Heroestix
                        </span>
                    </Link>
                </div>

                {/* Right Side: Navigation + Auth / CTA */}
                <div className="flex items-center gap-8">
                    {/* Navigation Menu - Desktop */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`
                                    text-[13px] font-semibold uppercase tracking-wider transition-all 
                                    ${scrolled ? "text-slate-600 hover:text-blue-600" : "text-white/90 hover:text-white"}
                                `}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {user ? (
                        <div className="relative group">
                            <div className={`
                                flex items-center gap-2 cursor-pointer transition-all
                                ${scrolled ? "text-slate-900" : "text-white"}
                            `}>
                                <div className="w-9 h-9 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                                    <FiUser size={16} className="text-blue-600" />
                                </div>
                                <span className="hidden sm:inline text-sm font-medium">{displayName}</span>
                            </div>

                            {/* Dropdown Menu - Sleek Dark/Professional */}
                            <div className="
                                absolute right-0 mt-4 w-56
                                rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100
                                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                                transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100
                                overflow-hidden
                            ">
                                <div className="px-4 py-3 border-b border-slate-50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signed in as</p>
                                    <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                                </div>

                                <Link
                                    to="/profile"
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                >
                                    <FiUser size={16} />
                                    <span>My Profile</span>
                                </Link>

                                {user?.role === "creator" && (
                                    <a
                                        href={`http://creator.${window.location.hostname.includes("localhost") ? "localhost" : "heroestix.com"}${window.location.port ? ":" + window.location.port : ""}`}
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors border-t border-slate-50"
                                    >
                                        <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white italic">C</div>
                                        <span>Creator Portal</span>
                                    </a>
                                )}

                                {user?.role === "developer" && (
                                    <a
                                        href={`http://dev.${window.location.hostname.includes("localhost") ? "localhost" : "heroestix.com"}${window.location.port ? ":" + window.location.port : ""}`}
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors border-t border-slate-50"
                                    >
                                        <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white italic">D</div>
                                        <span>Dev Portal</span>
                                    </a>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-slate-50"
                                >
                                    <FiLogOut size={16} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                to="/masuk"
                                className={`
                                    px-6 py-2.5 rounded-xl font-bold text-sm transition-all
                                    ${scrolled
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/10 hover:bg-blue-700"
                                        : "bg-white text-blue-600 hover:bg-blue-50"}
                                    hover:scale-105 active:scale-95
                                `}
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

