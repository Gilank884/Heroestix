import { motion } from 'framer-motion';
import useFadeIn from './useFadeIn';


const clients = [
    { name: 'PT. Contoh Sukses', desc: 'Enterprise - IT Support' },
    { name: 'Startup A', desc: 'Customer Support' },
    { name: 'UMKM B', desc: 'Helpdesk & Layanan' },
];


export default function ClientSection() {
    const ref = useFadeIn();
    return (
        <section ref={ref} className="w-full py-20 px-6 md:px-20" style={{ backgroundColor: '#FFF7E6' }}>
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-6xl mx-auto"
            >
                <h2 className="text-3xl font-semibold mb-6 text-blue-900">Client Kami</h2>
                <p className="text-lg text-blue-700 mb-8">HaiTicket telah dipercaya oleh berbagai organisasi, dari UMKM sampai korporasi besar.</p>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {clients.map((c) => (
                        <div key={c.name} className="p-6 bg-white rounded-lg shadow-sm">
                            <h3 className="font-semibold text-blue-900">{c.name}</h3>
                            <p className="text-sm text-blue-700">{c.desc}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}