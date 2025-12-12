import { motion } from 'framer-motion';
import useFadeIn from './useFadeIn';


export default function PaymentSection() {
    const ref = useFadeIn();
    return (
        <section ref={ref} className="w-full py-20 px-6 md:px-20 bg-white text-blue-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto"
            >
                <h2 className="text-3xl font-semibold mb-4">Cara Pembayaran Mudah</h2>
                <p className="text-lg text-blue-700 leading-relaxed mb-6">
                    Kami mendukung berbagai metode pembayaran: transfer bank, e-wallet
                    (OVO, GoPay, Dana), kartu kredit, dan invoice untuk klien korporat.
                    Prosesnya cepat, aman, dan terintegrasi dengan sistem tagihan kami.
                </p>
                <div className="flex flex-wrap gap-4">
                    <div className="px-4 py-2 bg-blue-50 rounded">Transfer Bank</div>
                    <div className="px-4 py-2 bg-blue-50 rounded">E-Wallet</div>
                    <div className="px-4 py-2 bg-blue-50 rounded">Kartu Kredit</div>
                    <div className="px-4 py-2 bg-blue-50 rounded">Invoice</div>
                </div>
            </motion.div>
        </section>
    );
}