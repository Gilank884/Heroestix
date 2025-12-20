export default function BottomBar() {
    return (
        <footer className="footer footer-center bg-primary text-primary-content p-10">
            <aside className="flex items-center gap-6">
                {/* Logo */}
                <img
                    src="/Logo/LogoDark.png"
                    alt="Company Logo"
                    className="w-32 h-auto"
                />

                {/* Text */}
                <div className="text-left">
                    <p className="font-bold text-lg">
                        ACME Industries Ltd.
                    </p>
                    <p className="text-sm">
                        Providing reliable tech since 1992
                    </p>
                    <p className="text-xs mt-1 opacity-80">
                        © {new Date().getFullYear()} – All rights reserved
                    </p>
                </div>
            </aside>
        </footer>
    );
}
