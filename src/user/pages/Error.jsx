import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PageNotFound() {
    const titleRef = useRef(null);
    const subRef = useRef(null);

    useEffect(() => {
        const tl = gsap.timeline();
        tl.fromTo(
            titleRef.current,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: "power4.out" }
        ).fromTo(
            subRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
            "-=0.5"
        );
    }, []);

    return (
        <section className="min-h-screen w-full bg-white flex items-center justify-center relative overflow-hidden">
            {/* Decorative blur background */}
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-purple-100 rounded-full blur-3xl opacity-50" />

            <div className="relative z-10 text-center px-6 max-w-2xl">
                {/* 404 */}
                <motion.h1
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-[120px] md:text-[160px] font-extrabold text-gray-900 leading-none"
                >
                    404
                </motion.h1>

                {/* Title */}
                <h2
                    ref={titleRef}
                    className="mt-4 text-2xl md:text-3xl font-bold text-gray-900"
                >
                    Bukan nomor stambuk, tapi ini halaman gak ketemu!
                </h2>

                {/* Subtitle */}
                <p
                    ref={subRef}
                    className="mt-4 text-gray-600 text-base md:text-lg"
                >
                    Nanti kalo udah ke Bandung bisa mampir ke kantor kami langsung deh!
                </p>

                {/* Action */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="mt-10 flex justify-center"
                >
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gray-900 text-white font-semibold shadow-lg hover:bg-gray-800 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Kembali ke Beranda
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
