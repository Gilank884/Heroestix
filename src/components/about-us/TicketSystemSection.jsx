import { motion } from 'framer-motion';
import useFadeIn from './useFadeIn';


export default function TicketSystemSection() {
    const ref = useFadeIn();
    return (
        <section ref={ref} className="w-full py-20 px-6 md:px-20 bg-red-500 text-blue-900">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-5xl mx-auto"
            >
                <h2 className="text-3xl font-semibold mb-4">Sistem Manajemen Tiket Kami</h2>
                <p className="text-lg text-blue-700 leading-relaxed mb-6">
                    Dashboard intuitif, pelacakan SLA, prioritas otomatis, routing
                    cerdas, dan integrasi notifikasi — semua tersusun agar tim support Anda
                    dapat merespon lebih cepat dan konsisten.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                        <h3 className="font-semibold">Pelacakan SLA</h3>
                        <p className="text-sm text-blue-700">Monitor waktu respon dan penyelesaian.</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                        <h3 className="font-semibold">Automasi & Routing</h3>
                        <p className="text-sm text-blue-700">Atur aturan untuk penugasan otomatis.</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                        <h3 className="font-semibold">Notifikasi</h3>
                        <p className="text-sm text-blue-700">Email, Slack, dan webhook real-time.</p>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}