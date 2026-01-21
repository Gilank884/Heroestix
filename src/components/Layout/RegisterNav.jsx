import { Link } from "react-router-dom";

export default function RegisterNav() {
    return (
        <nav
            className="
        fixed top-0 left-0 w-full h-16 flex items-center
        bg-white
        z-50
        shadow-md shadow-black/20
        transition-all duration-500
        hover:bg-[#b1451a]
        group
      "
        >
            <Link
                to="/"
                className="flex items-center gap-3 ml-10"
            >
                {/* LOGO */}
                <div className="flex items-center">
                    {/* Logo Dark */}
                    <img
                        src="/Logo/Logo.png"
                        alt="Logo Dark"
                        className="
              h-9 w-auto
              block
              transition-all duration-300
              group-hover:hidden
            "
                    />

                    {/* Logo Light */}
                    <img
                        src="/Logo/Logo.png"
                        alt="Logo Light"
                        className="
              h-9 w-auto
              hidden
              transition-all duration-300
              group-hover:block
            "
                    />
                </div>

                {/* TEXT */}
                <span
                    className="
            text-gray-800
            font-semibold
            text-lg
            transition-colors duration-300
            group-hover:text-white
          "
                >
                    Heroestix Official
                </span>
            </Link>
        </nav>
    );
}
