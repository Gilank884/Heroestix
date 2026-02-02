import React from "react";
import Navbar from '../../components/Layout/Navbar';
import Footer from '../../components/Layout/Footer';
import { motion } from "framer-motion";

export default function TermsOfService() {
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
                            Syarat & <span className="text-blue-600">Ketentuan</span>
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
                                Selamat datang di Heroestix. Harap baca Syarat dan Ketentuan ini dengan saksama sebelum menggunakan layanan kami. Dengan mengakses atau menggunakan situs web kami, Anda setuju untuk terikat oleh ketentuan ini.
                            </p>

                            <h3>1. Ketentuan Umum</h3>
                            <p>
                                Heroestix adalah platform manajemen tiket yang menghubungkan penyelenggara acara (Kreator) dengan pembeli tiket (Pengguna). Kami bertindak sebagai perantara agen penyedia platform dan tidak bertanggung jawab langsung atas pelaksanaan acara itu sendiri, kecuali dinyatakan lain.
                            </p>

                            <h3>2. Akun Pengguna</h3>
                            <ul>
                                <li><strong>Pendaftaran:</strong> Anda harus memberikan informasi yang akurat, lengkap, dan terbaru saat mendaftar akun.</li>
                                <li><strong>Keamanan Akun:</strong> Anda bertanggung jawab penuh atas keamanan kata sandi dan aktivitas yang terjadi di dalam akun Anda.</li>
                                <li><strong>Penyalahgunaan:</strong> Kami berhak menangguhkan atau menghapus akun yang melanggar hukum atau ketentuan penggunaan platform kami.</li>
                            </ul>

                            <h3>3. Pembelian Tiket</h3>
                            <ul>
                                <li><strong>Ketersediaan:</strong> Tiket dijual berdasarkan ketersediaan (first-come, first-served) dan harga dapat berubah sewaktu-waktu sesuai kebijakan penyelenggara.</li>
                                <li><strong>Konfirmasi Pesanan:</strong> Pembelian dianggap sah hanya setelah pembayaran berhasil dikonfirmasi dan E-Tiket diterbitkan ke email atau akun Anda.</li>
                                <li><strong>Validitas:</strong> E-Tiket hanya berlaku untuk satu kali masuk (kecuali tiket terusan) dan harus ditunjukkan saat check-in di lokasi acara.</li>
                            </ul>

                            <h3>4. Kebijakan Pengembalian Dana (Refund)</h3>
                            <p>
                                Semua penjualan tiket bersifat final dan tidak dapat dikembalikan (non-refundable), kecuali dalam kondisi berikut:
                            </p>
                            <ul>
                                <li>Acara <strong>dibatalkan</strong> sepenuhnya oleh penyelenggara.</li>
                                <li>Acara ditunda ke tanggal yang tidak memungkinkan bagi pemegang tiket (tergantung kebijakan spesifik penyelenggara acara).</li>
                            </ul>
                            <p>
                                Heroestix akan memfasilitasi proses pengembalian dana sesuai dengan dana yang tersedia dari penyelenggara, namun kami tidak menjamin pengembalian biaya layanan platform.
                            </p>

                            <h3>5. Kewajiban Pengguna di Lokasi Acara</h3>
                            <p>
                                Pengguna wajib mematuhi aturan yang ditetapkan oleh penyelenggara acara dan venue, termasuk namun tidak terbatas pada:
                            </p>
                            <ul>
                                <li>Tidak membawa barang-barang terlarang (senjata, obat-obatan terlarang, dll).</li>
                                <li>Menjaga ketertiban dan tidak melakukan tindakan yang mengganggu jalannya acara.</li>
                                <li>Penyelenggara berhak menolak masuk atau mengeluarkan pemegang tiket yang melanggar aturan tanpa pengembalian dana.</li>
                            </ul>

                            <h3>6. Hak Kekayaan Intelektual</h3>
                            <p>
                                Seluruh konten di situs Heroestix, termasuk logo, desain, teks, dan grafis, adalah milik Heroestix atau pemberi lisensinya dan dilindungi oleh hukum hak cipta. Pengguna dilarang menggunakan konten tersebut tanpa izin tertulis.
                            </p>

                            <h3>7. Batasan Tanggung Jawab</h3>
                            <p>
                                Heroestix tidak bertanggung jawab atas:
                            </p>
                            <ul>
                                <li>Perubahan isi acara, penampil, atau waktu pelaksanaan oleh penyelenggara.</li>
                                <li>Cedera, kehilangan, atau kerusakan properti pribadi selama acara berlangsung.</li>
                                <li>Gangguan teknis layanan yang disebabkan oleh kejadian di luar kendali kami (force majeure).</li>
                            </ul>

                            <h3>8. Kontak Kami</h3>
                            <p>
                                Jika Anda memiliki kendala terkait transaksi atau pertanyaan tentang syarat ini, hubungi layanan pelanggan kami:
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
