import { motion } from 'framer-motion';

export default function TicketSystemSection() {
    return (
        <section className="w-full py-12 px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-5xl mx-auto"
            >
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Sistem Ticketing Berkelanjutan</h2>
                    <p className="text-slate-500 font-medium max-w-2xl mx-auto">
                        Mulai dari pembuatan event hingga verifikasi di lokasi, semua proses dirancang untuk efisiensi tinggi dan keamanan maksimal.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 bg-[#fdf5f2] rounded-3xl border border-[#b1451a]/5 hover:shadow-lg transition-all duration-300">
                        <div className="w-12 h-12 bg-[#b1451a] rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-[#b1451a]/20">
                            <span className="font-bold">01</span>
                        </div>
                        <h3 className="font-black text-slate-800 mb-2">E-Ticket Instan</h3>
                        <p className="text-sm text-slate-500 font-medium">Tiket dikirimkan langsung ke email dan akun pengguna setelah transaksi berhasil.</p>
                    </div>
                    <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-slate-800/20">
                            <span className="font-bold">02</span>
                        </div>
                        <h3 className="font-black text-slate-800 mb-2">Manajemen Kategori</h3>
                        <p className="text-sm text-slate-500 font-medium">Atur berbagai kategori tiket mulai dari Early Bird hingga VIP dengan stok yang terdata.</p>
                    </div>
                    <div className="p-8 bg-[#fdf5f2] rounded-3xl border border-[#b1451a]/5 hover:shadow-lg transition-all duration-300">
                        <div className="w-12 h-12 bg-orange-400 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-400/20">
                            <span className="font-bold">03</span>
                        </div>
                        <h3 className="font-black text-slate-800 mb-2">Verifikasi QR Code</h3>
                        <p className="text-sm text-slate-500 font-medium">Proses check-in pengunjung yang cepat dan akurat menggunakan scan QR code terenkripsi.</p>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}