import React, { useState } from "react";
import Navbar from '../../components/Layout/Navbar';
import Footer from '../../components/Layout/Footer';
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function TermsOfService() {
    const [expandedSection, setExpandedSection] = useState(null);

    const toggleSection = (index) => {
        setExpandedSection(expandedSection === index ? null : index);
    };

    const policyPoints = [
        {
            title: "Definisi",
            content: (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2 text-lg">Halo, Sahabat Heroestix! 👋</h4>
                        <p className="leading-relaxed">
                            Terima kasih banyak telah meluangkan waktu untuk membaca ini dan menjadi bagian dari perjalanan seru kami! Kami di Heroestix sangat senang dan merasa terhormat Anda mempercayakan pengalaman acara dan hiburan Anda kepada kami. Kehadiran Anda adalah semangat terbesar bagi kami untuk terus berinovasi dan memberikan layanan yang lebih baik setiap harinya. Kami ingin memastikan Anda merasa aman, nyaman, dan dihargai setiap kali menggunakan platform kami.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 mb-2 text-lg">Mengenal Lebih Dekat Heroestix</h4>
                        <p className="leading-relaxed">
                            Heroestix bukan sekadar platform tiket biasa; kami adalah jembatan yang menghubungkan kreativitas para Creator hebat dengan antusiasme Anda yang luar biasa. Kami hadir untuk menciptakan ekosistem acara yang tidak hanya canggih dan aman, tetapi juga transparan dan mudah digunakan oleh siapa saja. Mulai dari konser musik yang memukau, workshop yang menginspirasi, hingga festival komunitas yang hangat, Heroestix berdedikasi untuk mempermudah akses Anda menuju momen-momen tak terlupakan. Komitmen kami adalah menjaga kepercayaan Anda dengan layanan yang jujur, responsif, dan selalu mengutamakan kepuasan Anda.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">Definisi</h4>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Heroestix:</strong> Heroestix adalah platform layanan digital yang dimiliki dan dikembangkan oleh PT Peristiwa Kreatif Nusantara yang menyediakan distribusi tiket, layanan acara, serta konten kreatif.</li>
                            <li><strong>Creator:</strong> Creator adalah individu, komunitas, organisasi, atau badan usaha yang menyediakan acara, tiket, atau Konten Kreatif melalui Heroestix.</li>
                            <li><strong>Pengguna:</strong> Pengguna adalah individu atau pihak yang membeli tiket, mengakses, atau menggunakan layanan dan Konten Kreatif yang tersedia dalam Heroestix.</li>
                            <li><strong>Konten Kreatif:</strong> Konten Kreatif adalah segala bentuk layanan digital baik berupa teks, gambar, video, audio, maupun kombinasi yang disediakan Creator kepada Pengguna.</li>
                            <li><strong>E-Ticket:</strong> E-Ticket adalah tiket digital yang diterbitkan melalui sistem Heroestix sebagai bukti akses layanan atau acara.</li>
                            <li><strong>Platform Fee:</strong> Platform Fee adalah biaya tambahan yang timbul dari penggunaan sistem digital, payment gateway, jaringan internet, atau layanan pihak ketiga.</li>
                            <li><strong>Pajak:</strong> Pajak adalah kewajiban perpajakan sesuai peraturan perundang-undangan Republik Indonesia.</li>
                        </ul>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-slate-500 text-sm italic leading-relaxed">
                            <strong>*Klausul Perubahan & Validitas Informasi:</strong> Seluruh definisi dan ketentuan yang tercantum dalam dokumen ini disusun berdasarkan standar operasional dan regulasi yang berlaku pada saat tanggal publikasi. Heroestix memegang hak prerogatif penuh untuk meninjau, mengamandemen, atau memperbarui klausul-klausul ini sewaktu-waktu tanpa pemberitahuan terpisah, guna memastikan kepatuhan terhadap dinamika hukum dan peningkatan kualitas layanan. Kami menyarankan Pengguna untuk memeriksa halaman ini secara berkala untuk mengetahui pembaruan terkini.
                        </p>
                    </div>
                </div>
            ),
            isExpandable: true
        },
        {
            title: "Ketentuan Umum",
            content: (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">1. Ketentuan Final</h4>
                        <p>Jika terdapat perbedaan penafsiran atau konflik antara ketentuan ini dan penggunaan layanan oleh Pengguna, Heroestix berhak menetapkan ketentuan yang berlaku secara final.</p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">2. Persetujuan Penggunaan Layanan</h4>
                        <p className="mb-3">Dengan mengakses atau menggunakan layanan Heroestix, Pengguna menyatakan memahami dan setuju untuk:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>2.1 Penggunaan Wajar:</strong> Menggunakan platform sesuai fungsi yang sah, tidak melanggar hukum, meresahkan masyarakat, atau bertentangan dengan peraturan yang berlaku.</li>
                            <li><strong>2.2 Larangan Pengambilan Data Tanpa Izin:</strong> Tidak menggunakan alat, mekanisme otomatis, atau metode teknis apapun untuk mengakses, menyalin, mengekstrak, atau memantau konten Heroestix tanpa izin resmi.</li>
                            <li><strong>2.3 Larangan Penyalahgunaan Infrastruktur:</strong> Tidak melakukan aktivitas yang dapat membebani, merusak, atau mengganggu sistem, jaringan, atau layanan Heroestix.</li>
                            <li><strong>2.4 Tanggung Jawab terhadap Konten Creator:</strong> Heroestix bertindak sebagai platform; seluruh konten, tiket, layanan, atau karya yang disediakan adalah tanggung jawab Creator. Heroestix tidak bertanggung jawab atas konflik, pembatalan, atau masalah lain yang muncul dari aktivitas Creator.</li>
                            <li><strong>2.5 Larangan Penyalahgunaan Identitas:</strong> Pengguna tidak diperkenankan menyamar sebagai individu, Creator, atau pihak lain untuk keuntungan pribadi atau merugikan pihak lain.</li>
                            <li><strong>2.6 Larangan Distribusi Tanpa Izin:</strong> Pengguna tidak diperbolehkan menjual, mendistribusikan, atau memperdagangkan tiket, akses, atau konten digital tanpa persetujuan resmi dari Heroestix atau Creator.</li>
                            <li><strong>2.7 Perlindungan Hak Kekayaan Intelektual:</strong> Pengguna wajib menghormati hak cipta, paten, merek dagang, rahasia dagang, dan hak hukum lainnya. Tidak boleh mengunggah, menyebarkan, atau menggunakan konten pihak ketiga tanpa izin.</li>
                            <li><strong>2.8 Larangan Penggandaan Tampilan Situs:</strong> Pengguna tidak diperkenankan menyalin, menampilkan ulang, atau mengintegrasikan bagian situs Heroestix ke platform lain tanpa persetujuan tertulis.</li>
                            <li><strong>2.9 Larangan Akses Tanpa Otorisasi:</strong> Pengguna tidak boleh mencoba mengakses sistem, akun pengguna lain, jaringan, atau server Heroestix tanpa izin.</li>
                            <li><strong>2.10 Larangan Manipulasi Mesin Pencari:</strong> Pengguna dilarang melakukan praktik SEO atau manipulasi mesin pencari yang tidak etis atau menyesatkan.</li>
                            <li><strong>2.11 Tanggung Jawab Informasi Pengguna:</strong> Pengguna bertanggung jawab atas keakuratan data yang dimasukkan, termasuk identitas, informasi pembayaran, atau data perbankan.</li>
                            <li><strong>2.12 Risiko Keamanan Data Pribadi:</strong> Heroestix tidak bertanggung jawab atas kebocoran data akibat perangkat, browser, aplikasi pihak ketiga, atau serangan pihak ketiga.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">3. Hubungan Layanan dengan Creator</h4>
                        <p>Semua transaksi, akses, dan layanan yang disediakan oleh Creator adalah hubungan langsung antara Pengguna dan Creator. Heroestix hanya menyediakan platform dan tidak bertanggung jawab atas kualitas layanan, keselamatan, atau kerugian yang timbul dari layanan Creator.</p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">4. Validitas Tiket dan Akses Digital</h4>
                        <p>Heroestix menjamin sistem penerbitan tiket bersifat unik. Namun, Heroestix tidak bertanggung jawab atas penyalahgunaan, penduplikasian, atau distribusi ulang tiket yang dilakukan setelah dikirim ke Pengguna.</p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">5. Ketentuan Tambahan dari Creator</h4>
                        <p>Setiap Creator dapat menetapkan syarat dan kebijakan tambahan terkait konten atau acara mereka. Pengguna wajib membaca ketentuan tersebut. Heroestix tidak bertanggung jawab jika akses ditolak atau dibatasi sesuai kebijakan Creator.</p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">6. Keadaan Kahar (Chaos Condition)</h4>
                        <p>Heroestix dan Creator tidak bertanggung jawab atas kegagalan layanan yang disebabkan oleh keadaan di luar kendali, termasuk bencana alam, wabah penyakit, konflik bersenjata, terorisme, atau kebijakan pemerintah yang membatasi pertemuan.</p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">7. Berlaku dan Perubahan Ketentuan</h4>
                        <p>Ketentuan ini berlaku sejak Pengguna mengakses atau menggunakan layanan Heroestix. Heroestix dapat memperbarui ketentuan ini kapan saja. Penggunaan layanan secara berkelanjutan setelah perubahan dianggap sebagai persetujuan terhadap ketentuan terbaru.</p>
                    </div>
                </div>
            ),
            isExpandable: true,
            expandLabel: "Lihat Ketentuan"
        },
        {
            title: "Tanggung Jawab",
            content: (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">Tanggung Jawab Creator</h4>
                        <p>Creator bertanggung jawab untuk menyediakan informasi acara, tiket, dan Konten Kreatif secara lengkap, akurat, dan benar. Creator menjamin legalitas, hak cipta, dan kepemilikan atas semua Konten Kreatif yang diunggah. Creator juga wajib memenuhi layanan yang dijanjikan kepada Pengguna sesuai deskripsi dan jadwal, menjaga keamanan data, akun, dan akses yang diberikan kepada Pengguna, serta mengelola proses refund, penjadwalan ulang, atau pembatalan sesuai ketentuan yang berlaku.</p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">Tanggung Jawab Pengguna</h4>
                        <p>Pengguna bertanggung jawab untuk memberikan data yang benar dan akurat saat melakukan transaksi atau registrasi akun. Pengguna wajib menjaga kerahasiaan akun, E-Ticket, dan kredensial lainnya, serta menggunakan layanan, tiket, dan Konten Kreatif sesuai ketentuan Heroestix dan Creator. Pengguna dilarang menyalahgunakan, mendistribusikan, atau memperjualbelikan E-Ticket atau Konten Kreatif secara ilegal dan wajib mematuhi peraturan serta tata tertib yang ditetapkan oleh Creator dan Heroestix.</p>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 mb-2">Tanggung Jawab Heroestix (PT Peristiwa Kreatif Nusantara)</h4>
                        <p>Heroestix bertanggung jawab untuk menyediakan platform yang aman, stabil, dan dapat diakses untuk transaksi, distribusi tiket, dan Konten Kreatif. Heroestix menjaga kerahasiaan data Pengguna dan Creator sesuai ketentuan hukum yang berlaku, memfasilitasi proses transaksi antara Creator dan Pengguna secara transparan, memberikan dukungan dan layanan pelanggan untuk menyelesaikan kendala terkait platform, serta mematuhi peraturan perundang-undangan yang berlaku.</p>
                    </div>
                </div>
            ),
            isExpandable: true,
            expandLabel: "Lihat Detail"
        },
        {
            title: "Program Transaksi",
            content: (
                <div className="space-y-4">
                    <p>
                        Semua transaksi di Heroestix dilakukan melalui sistem pembayaran digital yang tersedia di platform. Transaksi dianggap sah setelah pembayaran berhasil diverifikasi oleh sistem Heroestix.
                    </p>
                    <p>
                        Setiap transaksi dapat dikenakan Platform Fee yang timbul dari penggunaan sistem digital, payment gateway, jaringan internet, atau layanan pihak ketiga. Selain itu, transaksi juga dapat dikenakan Pajak sesuai peraturan perpajakan yang berlaku di Republik Indonesia.
                    </p>
                    <p>
                        E-Ticket diterbitkan secara digital dengan kode unik sebagai bukti kepemilikan tiket atau akses ke layanan dan acara yang disediakan Creator. Pengguna bertanggung jawab untuk menjaga keamanan dan kerahasiaan E-Ticket.
                    </p>
                    <p>
                        Kebijakan refund, penjadwalan ulang, atau pembatalan sepenuhnya menjadi tanggung jawab Creator. Heroestix hanya memfasilitasi proses tersebut melalui sistem, dan tidak menanggung maupun menjamin pengembalian dana kepada Pengguna.
                    </p>
                    <p>
                        Heroestix berhak menolak atau membatalkan transaksi yang terindikasi penipuan, penyalahgunaan sistem, atau aktivitas yang mencurigakan demi keamanan semua pihak.
                    </p>
                </div>
            ),
            isExpandable: true,
            expandLabel: "Lihat Detail"
        },
        {
            title: "Ganti Rugi",
            content: (
                <div className="space-y-4">
                    <p>
                        Pengguna dan Creator setuju untuk melepaskan dan membebaskan Heroestix (PT Peristiwa Kreatif Nusantara) dari segala klaim, tuntutan, kerugian, biaya, atau tanggung jawab yang timbul akibat penggunaan layanan, transaksi, tiket, atau Konten Kreatif, kecuali kerugian yang disebabkan langsung oleh kesalahan sistem Heroestix.
                    </p>
                    <p>
                        Kerugian yang dimaksud termasuk, tetapi tidak terbatas pada, kegagalan akses E-Ticket, pembatalan acara, penyalahgunaan tiket oleh pihak lain, atau kehilangan dana yang timbul akibat tindakan Creator atau Pengguna sendiri.
                    </p>
                    <p>
                        Heroestix bertanggung jawab untuk kerugian yang timbul dari kesalahan internal platform, termasuk kehilangan dana yang dikelola Heroestix atau gangguan sistem yang mengakibatkan hilangnya akses E-Ticket yang sah.
                    </p>
                    <p>
                        Pengguna dan Creator memahami bahwa setiap risiko penggunaan layanan berada pada pihak masing-masing, dan Heroestix hanya memfasilitasi transaksi atau distribusi Konten Kreatif, kecuali risiko yang timbul akibat kesalahan sistem Heroestix sebagaimana disebutkan di atas.
                    </p>
                </div>
            ),
            isExpandable: true,
            expandLabel: "Lihat Detail"
        },
        {
            title: "Jaminan",
            content: (
                <div className="space-y-4">
                    <p>Heroestix tidak menyatakan atau menjamin bahwa:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Penggunaan layanan Heroestix akan selalu aman, tepat waktu, bebas gangguan, atau kompatibel dengan perangkat keras, perangkat lunak, sistem, atau data lain.</li>
                        <li>Data yang tersimpan melalui layanan akan selalu akurat, lengkap, atau dapat diandalkan.</li>
                        <li>Kualitas konten, produk, atau layanan yang diperoleh melalui Heroestix akan memenuhi kebutuhan atau harapan Pengguna.</li>
                        <li>Kesalahan, cacat, atau gangguan pada layanan akan segera diperbaiki.</li>
                        <li>Server atau sistem Heroestix bebas dari virus, malware, atau komponen berbahaya lainnya.</li>
                        <li>Heroestix dapat melacak Pengguna berdasarkan lokasi atau data pribadi yang diberikan secara sempurna.</li>
                    </ul>
                    <p>
                        Layanan Heroestix disediakan “sebagaimana adanya”. Semua pernyataan, jaminan, atau kondisi, baik tersurat maupun tersirat, termasuk jaminan tersirat tentang kelayakan jual beli, kesesuaian untuk tujuan tertentu, atau tidak melanggar hak pihak ketiga, dikecualikan sejauh diizinkan oleh hukum.
                    </p>
                    <p>
                        Dengan ini, Pengguna mengakui dan menyetujui bahwa seluruh risiko yang timbul dari penggunaan layanan Heroestix sepenuhnya menjadi tanggung jawab Pengguna, dan Pengguna tidak berhak menuntut ganti rugi apapun dari Heroestix.
                    </p>
                </div>
            ),
            isExpandable: true,
            expandLabel: "Lihat Detail"
        },
        {
            title: "Lain Lain",
            content: (
                <div className="space-y-4 text-sm text-slate-500 text-left">
                    <p>
                        Heroestix berhak mengubah, menambah, atau mengurangi ketentuan dalam kebijakan dan layanan sewaktu-waktu tanpa pemberitahuan sebelumnya. Perubahan akan berlaku setelah dipublikasikan di platform Heroestix.
                    </p>
                    <p>
                        Seluruh ketentuan dalam dokumen ini tunduk pada hukum Republik Indonesia. Setiap sengketa yang timbul antara Heroestix, Creator, dan Pengguna akan diselesaikan terlebih dahulu melalui musyawarah untuk mufakat. Apabila musyawarah tidak mencapai kesepakatan, penyelesaian dapat dilakukan melalui jalur hukum sesuai peraturan yang berlaku.
                    </p>
                    <p>
                        Pengguna dan Creator tidak diperbolehkan mengalihkan hak dan kewajibannya kepada pihak lain tanpa persetujuan tertulis dari Heroestix.
                    </p>
                    <p>
                        Heroestix berhak menangguhkan, membatasi, atau menghentikan akses Pengguna atau Creator jika terdapat indikasi penyalahgunaan layanan, pelanggaran ketentuan, atau aktivitas yang membahayakan sistem.
                    </p>
                    <p>
                        Segala hal yang belum diatur dalam kebijakan ini akan mengikuti praktik terbaik yang berlaku di industri layanan digital dan sesuai ketentuan hukum di Indonesia.
                    </p>
                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <p className="font-semibold text-slate-600 mb-1">Heroestix Head Office</p>
                        <p className="text-slate-500">Komplek Bumi Panyileukan jl. Sauyunan 10 Blok F10 5, Kota Bandung</p>
                    </div>
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
                            Syarat & Ketentuan
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
                                            <span className="mr-2">{point.expandLabel || "Lihat Definisi"}</span>
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
