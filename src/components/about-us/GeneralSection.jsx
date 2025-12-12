import { motion } from 'framer-motion';
import useFadeIn from './useFadeIn';


export default function GeneralSection() {
    const ref = useFadeIn();
    return (
        <section ref={ref} className="w-full py-20 px-6 md:px-20 bg-white text-blue-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto text-center"
            >
                <h1 className="text-4xl font-extrabold mb-4">HaiTicket</h1>
                <p className="text-lg text-blue-700 leading-relaxed">
                    HaiTicket adalah platform manajemen tiket modern yang membantu bisnis
                    mengelola permintaan, keluhan, dan kebutuhan operasional dengan cepat
                    dan terstruktur. Fokus kami adalah kecepatan, transparansi, dan
                    pengalaman pengguna yang mudah diakses.
                </p>
            </motion.div>
        </section>
    );
}