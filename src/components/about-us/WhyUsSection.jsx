import { motion } from 'framer-motion';
import useFadeIn from './useFadeIn';


export default function WhyUsSection() {
    const ref = useFadeIn();
    return (
        <section ref={ref} className="w-full py-20 px-6 md:px-20 bg-blue-50 text-blue-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-5xl mx-auto"
            >
                <h2 className="text-3xl font-semibold mb-4">Kenapa Memilih HaiTicket?</h2>
                <ul className="list-disc pl-6 space-y-3 text-blue-700 text-lg">
                    <li>Antarmuka bersih dan mudah digunakan</li>
                    <li>Penanganan tiket lebih cepat dengan automasi</li>
                    <li>Integrasi fleksibel (API, webhook, chatops)</li>
                    <li>Dukungan pelanggan dan onboarding profesional</li>
                </ul>
            </motion.div>
        </section>
    );
}