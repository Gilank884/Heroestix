import { Link } from "react-router-dom";

export default function RegisterNav({ role = "user" }) {
    const isCore = role === "creator" || role === "developer";

    return (
        <nav
            className={`
        fixed top-0 left-0 w-full h-16 flex items-center
        ${isCore ? "bg-transparent" : "bg-white"}
        z-50
        ${isCore ? "" : "shadow-md shadow-black/20"}
        transition-all duration-500
        ${isCore ? "" : "hover:bg-[#b1451a]"}
        group
      `}
        >
            <Link
                to="/"
                className="flex items-center gap-3 ml-10"
            >
                {/* LOGO */}
                <div className="flex items-center">
                    <img
                        src="/Logo/Logo.png"
                        alt="Logo"
                        className="h-9 w-auto"
                    />
                </div>

                {/* TEXT */}
                <div className="flex flex-col">
                    <span
                        className={`
                        ${isCore ? "text-white" : "text-gray-800"}
                        font-black
                        text-lg
                        tracking-tighter
                        transition-colors duration-300
                        ${isCore ? "" : "group-hover:text-white"}
                        italic uppercase
                    `}
                    >
                        Heroestix {isCore ? <span className="text-orange-500 ml-1">Core</span> : "Official"}
                    </span>
                    {isCore && (
                        <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.2em] -mt-1">
                            {role} Portal
                        </span>
                    )}
                </div>
            </Link>
        </nav>
    );
}
