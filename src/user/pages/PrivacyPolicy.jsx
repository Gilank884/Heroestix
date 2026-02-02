import React from "react";
import Navbar from '../../components/Layout/Navbar';
import Footer from '../../components/Layout/Footer';
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            <main className="pt-32 pb-24 px-6 md:px-12 bg-white">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4"
                        >
                            Kebijakan <span className="text-blue-600">Privasi</span>
                        </motion.h1>
                        <p className="text-slate-500 text-lg font-medium">
                            Terakhir diperbarui: 2 Februari 2026
                        </p>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-a:text-blue-600 hover:prose-a:text-blue-700"
                        >
                            <p className="lead">
                                Di Heroestix, kami sangat menghargai privasi Anda. Dokumen Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat menggunakan platform kami.
                            </p>

                            <h3>1. Informasi yang Kami Kumpulkan</h3>
                            <p>
                                Kami mengumpulkan beberapa jenis informasi untuk memberikan layanan terbaik bagi Anda:
                            </p>
                            <ul>
                                <li><strong>Informasi Pribadi:</strong> Nama, alamat email, nomor telepon, dan data lain yang Anda berikan saat mendaftar atau membeli tiket.</li>
                                <li><strong>Data Transaksi:</strong> Detail pembelian tiket, metode pembayaran, dan riwayat pesanan (kami tidak menyimpan detail kartu kredit/debit secara penuh).</li>
                                <li><strong>Data Penggunaan:</strong> Informasi tentang bagaimana Anda mengakses dan menggunakan situs kami, termasuk alamat IP, jenis perangkat, dan browser.</li>
                            </ul>

                            <h3>2. Penggunaan Informasi</h3>
                            <p>
                                Kami menggunakan informasi yang dikumpulkan untuk tujuan berikut:
                            </p>
                            <ul>
                                <li>Memproses pesanan tiket dan pembayaran Anda secara akurat.</li>
                                <li>Mengirimkan E-Tiket dan konfirmasi pesanan ke email Anda.</li>
                                <li>Memberikan dukungan pelanggan dan menanggapi pertanyaan Anda.</li>
                                <li>Meningkatkan fungsionalitas dan keamanan platform Heroestix.</li>
                                <li>Mengirimkan informasi promo atau event menarik (jika Anda setuju untuk berlangganan).</li>
                            </ul>

                            <h3>3. Perlindungan & Keamanan Data</h3>
                            <p>
                                Keamanan data Anda adalah prioritas utama kami. Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi informasi pribadi Anda dari akses, penggunaan, atau pengungkapan yang tidak sah. Protokol enkripsi standar industri digunakan untuk melindungi data sensitif selama transmisi.
                            </p>

                            <h3>4. Berbagi Informasi dengan Pihak Ketiga</h3>
                            <p>
                                Kami tidak menjual atau menyewakan informasi pribadi Anda kepada pihak ketiga. Kami hanya membagikan data Anda dalam situasi berikut:
                            </p>
                            <ul>
                                <li><strong>Penyelenggara Event:</strong> Nama dan alamat email Anda mungkin dibagikan kepada penyelenggara event yang tiketnya Anda beli untuk keperluan verifikasi dan check-in.</li>
                                <li><strong>Penyedia Layanan:</strong> Kami bekerja sama dengan mitra terpercaya (seperti gateway pembayaran) yang membantu kami dalam operasional layanan.</li>
                                <li><strong>Kewajiban Hukum:</strong> Jika diwajibkan oleh hukum atau permintaan resmi dari penegak hukum yang sah.</li>
                            </ul>

                            <h3>5. Cookie dan Teknologi Pelacakan</h3>
                            <p>
                                Kami menggunakan cookie untuk meningkatkan pengalaman pengguna Anda. Cookie membantu kami mengingat preferensi Anda, menjaga sesi login, dan menganalisis lalu lintas situs web. Anda dapat mengatur browser Anda untuk menolak cookie, namun hal ini mungkin memengaruhi fungsi tertentu dari situs web.
                            </p>

                            <h3>6. Kontrol Privasi Anda</h3>
                            <p>
                                Anda memiliki hak untuk:
                            </p>
                            <ul>
                                <li>Mengakses dan memperbarui informasi pribadi Anda melalui halaman profil.</li>
                                <li>Meminta penghapusan akun dan data pribadi Anda dari sistem kami.</li>
                                <li>Berhenti berlangganan dari komunikasi pemasaran kapan saja.</li>
                            </ul>

                            <h3>7. Hubungi Kami</h3>
                            <p>
                                Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi tim kami:
                            </p>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 not-prose">
                                <ul className="space-y-2 text-sm font-medium text-slate-600 mb-0">
                                    <li><strong>Email:</strong> support@heroestix.com</li>
                                    <li><strong>Alamat:</strong> Komplek Bumi Panyileukan jl. Sauyunan 10 Blok F10 5, Kota Bandung</li>
                                    <li><strong>WhatsApp:</strong> +62 823-3290-1726</li>
                                </ul>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
