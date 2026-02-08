import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiUser, FiLogOut } from "react-icons/fi";
import { supabase } from "../../lib/supabaseClient";
import { getSubdomainUrl } from "../../lib/navigation";
import useAuthStore from "../../auth/useAuthStore";


const Navbar = ({ alwaysScrolled = false }) => {
    // Force navbar to always appear in the "scrolled" (solid) state
    const scrolled = true;
    const { user, role, isAuthenticated, logout } = useAuthStore();

    // Logout
    const handleLogout = async () => {
        await supabase.auth.signOut();
        logout();
    };

    const displayName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.username ||
        "User";

    const navLinks = [
        { name: "Beranda", path: "/" },
        { name: "Become a Creator", path: "/become-creator" },
        { name: "About Us", path: "/about-us" },
        { name: "Contact Us", path: "https://wa.me/6282332901726", isExternal: true }
    ];

    const [sessionTokens, setSessionTokens] = useState(null);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setSessionTokens({
                    access_token: session.access_token,
                    refresh_token: session.refresh_token
                });
            }
        };
        getSession();
    }, [user]); // Re-fetch if user changes

    // Helper to generate auth-appended URL
    const getAuthUrl = (subdomain) => {
        const host = window.location.hostname;
        const isLocalhost = host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");

        let hash = "";
        if (isLocalhost && sessionTokens) {
            hash = `#access_token=${sessionTokens.access_token}&refresh_token=${sessionTokens.refresh_token}`;
        }

        return getSubdomainUrl(subdomain, hash);
    };

    return (
        <header
            className={`
                fixed top-6 left-1/2 -translate-x-1/2 z-50 
                w-[90%] md:w-[95%] max-w-6xl
                transition-all duration-300 ease-in-out
                rounded-full border border-white/40 shadow-2xl shadow-blue-900/10
                backdrop-blur-md 
                ${scrolled
                    ? "py-3 bg-white/80 supports-[backdrop-filter]:bg-white/60"
                    : "py-4 bg-white/10"}
            `}
        >
            <div className="px-6 md:px-8 flex items-center justify-between">
                {/* Logo Section - Professional Blue */}
                <div className="flex items-center gap-10">
                    <Link to="/" className="flex-shrink-0 flex items-center gap-3 group/logo">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center transform group-hover/logo:rotate-12 transition-transform duration-300 shadow-lg shadow-blue-600/30">
                            <img
                                src="/Logo/Logo.png"
                                alt="Heroestix Logo"
                                className="h-5 w-auto brightness-0 invert"
                            />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-800 group-hover/logo:text-blue-600 transition-colors duration-300">
                            Heroestix
                        </span>
                    </Link>
                </div>

                {/* Right Side: Navigation + Auth / CTA */}
                <div className="flex items-center gap-8">
                    {/* Navigation Menu - Desktop */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((item) => (
                            item.isExternal ? (
                                <a
                                    key={item.name}
                                    href={item.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors relative group"
                                >
                                    {item.name}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                                </a>
                            ) : (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors relative group"
                                >
                                    {item.name}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                                </Link>
                            )
                        ))}
                    </nav>

                    {user ? (
                        <div className="relative group">
                            <div className="flex items-center gap-3 cursor-pointer p-1 pr-4 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                                <div className="w-9 h-9 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
                                    {user.user_metadata?.avatar_url ? (
                                        <img
                                            src={user.user_metadata.avatar_url}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                    ) : null}
                                    <FiUser
                                        size={16}
                                        className="text-blue-600"
                                        style={{ display: user.user_metadata?.avatar_url ? 'none' : 'block' }}
                                    />
                                </div>
                                <span className="hidden sm:inline text-sm font-semibold text-slate-700">{displayName}</span>
                            </div>

                            {/* Dropdown Menu - Sleek Dark/Professional */}
                            <div className="
                                absolute right-0 mt-4 w-60
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
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded-xl"
                                    >
                                        <FiUser size={16} />
                                        <span>My Profile</span>
                                    </Link>

                                    {role === "creator" && (
                                        <a
                                            href={getAuthUrl("creator")}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded-xl"
                                        >
                                            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white italic">C</div>
                                            <span>Creator Portal</span>
                                        </a>
                                    )}

                                    {role === "developer" && (
                                        <a
                                            href={getAuthUrl("dev")}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded-xl"
                                        >
                                            <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white italic">D</div>
                                            <span>Dev Portal</span>
                                        </a>
                                    )}

                                    <div className="border-t border-slate-100 my-1"></div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors rounded-xl"
                                    >
                                        <FiLogOut size={16} />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                to="/masuk"
                                className="
                                    px-7 py-2.5 rounded-full font-bold text-sm transition-all
                                    bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5
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

