import { motion } from 'framer-motion';
import { HiCheckCircle } from 'react-icons/hi';

export default function PaymentSection() {
    const methods = ["Transfer Bank", "E-Wallet (OVO/GoPay)", "Kartu Kredit", "Invoice Korporat"];

    return (
        <section className="w-full py-12 px-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden"
            >
                {/* Decorative radial gradient */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#b1451a20,transparent)] pointer-events-none" />

                <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Pembayaran Tiket <span className="text-[#b1451a]">Instan & Aman.</span></h2>
                    <p className="text-slate-400 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                        Kami menyediakan berbagai metode pembayaran yang memudahkan Anda mendapatkan tiket dalam sekejap. Semua transaksi pembelian tiket diproses melalui sistem yang aman dan terverifikasi otomatis.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {methods.map((m, idx) => (
                            <motion.div
                                key={m}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-3 rounded-full text-white font-bold text-sm hover:bg-white/10 transition-colors"
                            >
                                <HiCheckCircle className="text-[#b1451a] text-lg" />
                                {m}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    );
}