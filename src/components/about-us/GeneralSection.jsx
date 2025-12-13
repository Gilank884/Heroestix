import { motion } from "framer-motion";
import useFadeIn from "./useFadeIn";

export default function GeneralSection() {
    const ref = useFadeIn();

    return (
        <section
            ref={ref}
            className="
                relative w-full 
                px-6 md:px-20 py-28
                text-blue-900 
                bg-[url('/assets/background.svg')] bg-cover bg-center
                before:absolute before:inset-x-0 before:top-0 before:h-32
                before:bg-gradient-to-b before:from-white/0 before:to-white/80
                before:pointer-events-none
            "
        >
            <div className="relative z-10 max-w-4xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl font-extrabold mb-4">HaiTicket</h1>
                    <p className="text-lg text-blue-700 leading-relaxed">
                        HaiTicket adalah platform manajemen tiket modern yang membantu bisnis
                        mengelola permintaan, keluhan, dan kebutuhan operasional dengan cepat
                        dan terstruktur. Fokus kami adalah kecepatan, transparansi, dan
                        pengalaman pengguna yang mudah diakses.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
