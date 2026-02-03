import React, { useState } from "react";
import Navbar from '../../components/Layout/Navbar';
import Footer from '../../components/Layout/Footer';
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function PrivacyPolicy() {
    const [expandedSection, setExpandedSection] = useState(null);

    const toggleSection = (index) => {
        setExpandedSection(expandedSection === index ? null : index);
    };

    const policyPoints = [
        {
            title: "Pengumpulan Data",
            content: (
                <div className="space-y-4">
                    <p>
                        Heroestix mengumpulkan data dari Pengguna dan Creator untuk memastikan layanan berjalan dengan baik. Data yang dikumpulkan dapat berupa nama, alamat email, nomor telepon, informasi pembayaran, data transaksi, dan aktivitas penggunaan platform.
                    </p>
                    <p>
                        Data tambahan seperti perangkat, lokasi, atau data perilaku pengguna juga dapat dikumpulkan untuk meningkatkan keamanan, performa, dan pengalaman layanan. Pengumpulan data dilakukan sesuai dengan hukum yang berlaku dan dengan persetujuan pengguna.
                    </p>
                </div>
            ),
            isExpandable: true,
            expandLabel: "Lihat Detail"
        },
        {
            title: "Penggunaan Data",
            content: (
                <div className="space-y-4">
                    <p>Data yang dikumpulkan digunakan untuk:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Memproses transaksi dan penerbitan E-Ticket</li>
                        <li>Menyediakan Konten Kreatif sesuai akses pengguna</li>
                        <li>Mengirim notifikasi penting, update layanan, atau promosi resmi Heroestix</li>
                        <li>Meningkatkan pengalaman pengguna dan keamanan platform</li>
                        <li>Mematuhi kewajiban hukum dan peraturan perpajakan</li>
                    </ul>
                    <p>Heroestix tidak menggunakan data untuk tujuan yang merugikan Pengguna atau Creator.</p>
                </div>
            ),
            isExpandable: true,
            expandLabel: "Lihat Detail"
        },
        {
            title: "Penyimpanan dan Keamanan Data",
            content: (
                <div className="space-y-4">
                    <p>
                        Heroestix menyimpan data pada server yang aman dengan proteksi teknologi terkini. Akses data dibatasi hanya untuk tim internal yang memerlukan untuk operasional layanan.
                    </p>
                    <p>
                        Heroestix melakukan enkripsi pada informasi sensitif, termasuk data pembayaran dan kredensial akun, untuk mencegah akses tidak sah. Pengguna bertanggung jawab menjaga keamanan akun mereka, termasuk password dan E-Ticket.
                    </p>
                </div>
            ),
            isExpandable: true,
            expandLabel: "Lihat Detail"
        },
        {
            title: "Pengungkapan Data",
            content: (
                <div className="space-y-4">
                    <p>Heroestix tidak menjual data pribadi kepada pihak ketiga. Data dapat dibagikan secara terbatas jika:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Diperlukan untuk proses transaksi dengan Creator atau pihak payment gateway</li>
                        <li>Diperlukan untuk mematuhi hukum, peraturan, atau permintaan otoritas yang sah</li>
                        <li>Dalam kasus merger, akuisisi, atau transfer bisnis, dengan pemberitahuan kepada Pengguna</li>
                    </ul>
                    <p>Setiap pengungkapan dilakukan dengan memperhatikan keamanan dan privasi pengguna.</p>
                </div>
            ),
            isExpandable: true,
            expandLabel: "Lihat Detail"
        },
        {
            title: "Hak Pengguna dan Akses Data",
            content: (
                <div className="space-y-4">
                    <p>Pengguna berhak:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Mengakses data pribadi yang dikumpulkan Heroestix</li>
                        <li>Memperbaiki atau memperbarui informasi yang tidak akurat</li>
                        <li>Mengajukan penghapusan data pribadi, sesuai ketentuan hukum yang berlaku</li>
                        <li>Menolak penggunaan data untuk tujuan promosi atau marketing</li>
                        <li>Mengajukan pertanyaan atau keluhan terkait privasi melalui kontak resmi Heroestix</li>
                    </ul>
                    <p>
                        Heroestix berkomitmen untuk menanggapi permintaan pengguna terkait data pribadi secara transparan dan dalam jangka waktu yang wajar.
                    </p>
                </div>
            ),
            isExpandable: true,
            expandLabel: "Lihat Detail"
        }
    ];

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            <main className="pt-32 pb-24 px-6 md:px-12 bg-white">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-left mb-8">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xl font-bold text-slate-500 mb-1"
                        >
                            Kebijakan Privasi
                        </motion.h1>
                        <p className="text-slate-400 text-sm">
                            Terakhir diperbarui: 3 Februari 2026
                        </p>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        {policyPoints.map((point, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                            >
                                <div
                                    className={`p-6 md:p-8 flex items-center justify-between cursor-pointer ${point.isExpandable ? 'bg-slate-50 hover:bg-slate-100 transition-colors' : ''}`}
                                    onClick={() => point.isExpandable ? toggleSection(index) : null}
                                >
                                    <h3 className="text-xl font-bold text-slate-900 m-0">
                                        {point.title}
                                    </h3>
                                    {point.isExpandable && (
                                        <div className="flex items-center text-blue-600 font-semibold text-sm">
                                            <span className="mr-2">{point.expandLabel || "Lihat Detail"}</span>
                                            {expandedSection === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    )}
                                </div>

                                <AnimatePresence>
                                    {(!point.isExpandable || expandedSection === index) && (
                                        <motion.div
                                            initial={point.isExpandable ? { height: 0, opacity: 0 } : { opacity: 1 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-6 md:p-8 pt-0 prose prose-slate max-w-none text-slate-600">
                                                {point.content}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
