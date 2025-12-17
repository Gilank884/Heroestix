import { motion } from "framer-motion";
import useFadeIn from "./useFadeIn";

export default function GeneralSection() {
    const ref = useFadeIn();

    return (
        <section
            ref={ref}
            className="
        relative
        min-h-screen
        flex items-center justify-center
        grid-pattern
        bg-background
      "
        >
            {/* overlay biar grid halus */}
            <div className="absolute inset-0 bg-background/30" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 max-w-3xl text-center px-6"
            >
                <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
                    HaiTicket
                </h1>

                <p className="text-lg md:text-xl text-blue-700 leading-relaxed">
                    HaiTicket adalah platform manajemen tiket modern yang membantu bisnis
                    mengelola permintaan, keluhan, dan kebutuhan operasional dengan cepat
                    dan terstruktur. Fokus kami adalah kecepatan, transparansi, dan
                    pengalaman pengguna yang mudah diakses.
                </p>
            </motion.div>
        </section>
    );
}
