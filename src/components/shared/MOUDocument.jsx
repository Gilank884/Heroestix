import React from 'react';
import { Image, FileText } from 'lucide-react';

const MOUDocument = ({ data, containerId = "mou-document-container" }) => {
    return (
        <div id={containerId} className="bg-white border border-slate-100 rounded-2xl p-8 h-[36rem] overflow-y-auto mb-8 custom-scrollbar shadow-inner text-slate-600 text-[10px] leading-relaxed space-y-8">
            {/* Header Section */}
            <div className="text-center border-b border-slate-100 pb-8 space-y-2">
                <h3 className="font-black text-slate-900 text-sm md:text-base">PERJANJIAN KERJASAMA PLATFORM HEROESTIX INDONESIA</h3>
                <p className="font-bold text-slate-400">Nomor: [YANG MENGISI PIHAK HEROESTIX]</p>
                <p className="font-bold text-slate-400">Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            {/* Pihak-Pihak Detail */}
            <div className="space-y-6">
                <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                    <h4 className="font-black text-blue-600 uppercase tracking-widest text-[11px] mb-4">1 PLATFORM PROVIDER</h4>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <p className="font-black text-slate-900 text-xs">HEROESTIX INDONESIA</p>
                            <p className="font-bold text-slate-500 text-[10px]">Akta Pendirian Nomor 40</p>
                            <p className="font-bold text-slate-500 text-[10px]">SK KEMENKUMHAM No. AHU-0037234-AH.01.14</p>
                        </div>
                        <div className="text-slate-600 space-y-1 leading-relaxed">
                            <p className="font-medium text-[10px]">Jl. Rajawali, Perumahan Citra Graha, Drono, No 2, Drono, Sardonoharjo, Kec. Ngaglik, Kab.Sleman, Daerah Istimewa Yogyakarta 55581</p>
                            <p className="pt-2"><span className="font-bold">CEO:</span> Brian Ellia Aryanto</p>
                            <p><span className="font-bold">BOD:</span> Bima Dwi Kurnianto</p>
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                    <h4 className="font-black text-blue-600 uppercase tracking-widest text-[11px] mb-4">EVENT MANAGER</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Organisasi/Perusahaan</p>
                            <p className="font-bold text-slate-700">{data?.brand_name || <span className="bg-yellow-200 text-yellow-800 px-1 rounded">Diisi Dari Pemberkasan</span>}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alamat Korespondensi</p>
                            <p className="font-bold text-slate-700">{data?.company_address || data?.address || <span className="bg-yellow-200 text-yellow-800 px-1 rounded">Diisi Dari Pemberkasan</span>}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Penanggung Jawab (Ketua/Principle)</p>
                            <p className="font-bold text-slate-700">{data?.director_name || <span className="bg-yellow-200 text-yellow-800 px-1 rounded">Diisi Dari Pemberkasan</span>}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nomor Telp/Lainnya</p>
                            <p className="font-bold text-slate-700">{data?.phone || <span className="bg-yellow-200 text-yellow-800 px-1 rounded">Diisi Dari Pemberkasan</span>}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Penanggung Jawab</p>
                            <p className="font-bold text-slate-700">{data?.email || <span className="bg-yellow-200 text-yellow-800 px-1 rounded">Diisi Dari Pemberkasan</span>}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Rekening Integration */}
            <div className="p-5 bg-blue-50/30 rounded-2xl border border-blue-100/50 space-y-4">
                <h4 className="font-black text-blue-700 uppercase tracking-widest text-[11px] text-center">DATA REKENING</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bank</p>
                        <p className="font-black text-slate-800 uppercase">{data?.bank_name || <span className="bg-yellow-200 text-yellow-800 px-1 rounded">Diisi Dari Pemberkasan</span>}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Atas Nama</p>
                        <p className="font-black text-slate-800 uppercase">{data?.bank_account_holder || data?.bank_holder_name || <span className="bg-yellow-200 text-yellow-800 px-1 rounded">Diisi Dari Pemberkasan</span>}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nomor Rekening</p>
                        <p className="font-black text-slate-800 uppercase">{data?.bank_account_number || data?.bank_account || <span className="bg-yellow-200 text-yellow-800 px-1 rounded">Diisi Dari Pemberkasan</span>}</p>
                    </div>
                </div>
            </div>

            <div className="pt-4 pb-2 text-justify">
                <p className="font-medium text-slate-700">Perjanjian ini berlaku dengan mengacu pada Syarat dan Ketentuan yang berlaku sebagai bagian integral dan satu kesatuan yang mengikat bersamaan dengan Perjanjian ini.</p>
            </div>
            
            {/* TTD Header */}
            <div className="pt-4 border-t border-slate-100 text-[10px] space-y-4 text-justify mb-8">
                <p>Perjanjian beserta dengan Syarat dan Ketentuan ini disepakati dan ditandatangani Para Pihak dalam keadaan sadar, sehat jasmani dan rohani, serta tidak di bawah tekanan atau paksaan dari pihak manapun; Para Pihak sepakat untuk menaati dan melaksanakan Perjanjian ini dengan itikad baik. Demikian Perjanjian ini dibuat dan ditandatangani oleh Para Pihak di atas meterai secukupnya atau menggunakan (sarana digital); masing-masing rangkap memiliki kekuatan hukum yang sama dan berlaku sebagai alat bukti yang sah.</p>
            </div>

            {/* SYARAT DAN KETENTUAN BERLAKU */}
            <div className="space-y-6 pt-8 border-t-2 border-slate-800">
                <h4 className="font-black text-slate-900 border-b border-slate-300 inline-block pb-1 uppercase text-[12px]">Syarat Dan Ketentuan Berlaku</h4>
                
                {/* Pasal 1 */}
                <div className="space-y-3 text-justify">
                    <h5 className="font-black text-slate-900 uppercase">Pasal 1: Definisi</h5>
                    <div className="space-y-2 pl-4">
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.1.</span><p><span className="font-black">Heroestix/Heroestix Indonesia</span> merupakan suatu platform ticketing yang menyediakan dan mengintegrasikan kebutuhan event manager mulai dari transaksi online, on the spot, dan gate system, dimana berperan sebagai Platform Provider.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.2.</span><p><span className="font-black">Event Manager</span> adalah kelompok atau organisasi atau badan hukum yang sah yang mana merupakan pembuat atau penanggungjawab dari sebuah acara atau (event) dan merupakan pihak yang terikat dalam Perjanjian Kerjasama ini.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.3.</span><p><span className="font-black">Biaya Langganan</span> adalah biaya yang dikenakan oleh (Platform Provider) kepada (Event Manager) untuk setiap kontrak Kerjasama dengan nominal yang telah disepakati.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.4.</span><p><span className="font-black">Merchandise</span> adalah barang pelengkap (event) yang dipesan bersama dan/atau diluar dengan pemakaian sistem administrasi Heroestix Indonesia. Merchandise dapat berupa seminar kit baik beserta sertifikat maupun tidak, kaos/kemeja/polo, mug, tumbler, dan barang pelengkap event lain yang disepakati diawal.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.5.</span><p><span className="font-black">Bahan Cetak</span> adalah produksi perlengkapan acara yang melibatkan proses printing. Dalam hal ini adalah tiket gelang, banner, dan poster.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.6.</span><p><span className="font-black">Hari Kerja</span> adalah hari selain Sabtu, Minggu, dan hari libur nasional, di mana bank-bank di Indonesia beroperasi untuk melakukan kegiatan finansial.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.7.</span><p><span className="font-black">Layanan Pembayaran</span> adalah jenis-jenis metode pembayaran Transaksi Internet yang tersedia di Sistem Pembayaran Internet.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.8.</span><p><span className="font-black">Pelanggan</span> adalah pelaku Transaksi Internet di (Merchant), melalui Sistem Pembayaran Internet.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.9.</span><p><span className="font-black">Merchant</span> adalah toko online yang tersedia di website resmi Heroestix Indonesia dengan domain heroestix.com dan/atau sub-domain yang secara resmi telah dirilis oleh Heroestix Indonesia.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.10.</span><p><span className="font-black">Fitur Khusus</span> merupakan permintaan fitur diluar dari fasilitas standar yang ada pada Heroestix Indonesia, fitur tersebut dapat berupa Custom Website, Custom Domain, atau permintaan khusus lainnya yang disepakati.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.11.</span><p><span className="font-black">Sarana Digital</span> adalah penggunaan metode atau perantara untuk mendokumentasikan tanda tangan digital, paraf digital, pemindaian wajah atau biometrics yang ditujukan untuk pengesahan dokumen legalitas, yang mana tidak ditujukan untuk penggunaan pribadi yang merugikan kedua belah pihak. Sarana Digital juga dapat berupa alat yang digunakan untuk pembuktian legalitas dari segala aktivitas yang melibatkan proses Kerjasama dan/atau aktivitas finansial. Alat pembuktian tersebut dapat berupa chat whatsapp, email, voice recording, maupun media digital lainnya.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.12.</span><p><span className="font-black">Event</span> adalah produk dari (Event Manager) yang akan dijual melalui website resmi Heroestix Indonesia.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.13.</span><p><span className="font-black">Listing</span> adalah proses pengaktifan produk dari (Event manager) sehingga dapat ditampilkan pada situs resmi Heroestix Indonesia.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.14.</span><p><span className="font-black">Internet Fee</span> adalah biaya yang ditarik pada besaran tertentu sesuai dengan total transaksi yang terjadi dan akan digunakan oleh (Platform Provider) untuk proses verifikasi pembayaran online real-time kepada payment gateway serta biaya pemeliharaan sistem.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.15.</span><p><span className="font-black">Sistem Pembayaran Internet</span> adalah sistem pembayaran yang dimiliki dan dikelola oleh Payment Gateway, yang menghubungkan antara Bank/Service Provider, Platform Provider, dan Event Manager.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.16.</span><p><span className="font-black">Tax atau Pajak</span> merupakan pajak yang mengacu pada peraturan pemerintah pusat maupun daerah untuk suatu kejadian dan/atau transaksi yang secara perundang-undangan telah diatur untuk dipotong atau dipungut sesuai dengan tarif yang berlaku melalui website resmi Heroestix Indonesia.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.17.</span><p><span className="font-black">Service Provider</span> adalah penyedia jasa metode pembayaran selain Bank, yang memiliki kerjasama dan telah terhubung dengan Payment Gateway.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.18.</span><p><span className="font-black">Platform Manager/Provider</span> merupakan penyedia jasa sistem administrasi, dimana dalam hal ini adalah Heroestix Indonesia.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.19.</span><p><span className="font-black">Transaksi Internet</span> adalah transaksi melalui media elektronik yang dilakukan oleh Pelanggan di situs (Merchant), dan diproses oleh Sistem Pembayaran Internet.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.20.</span><p><span className="font-black">PIC/Principle</span> merupakan seorang yang paling bertanggung jawab atau memiliki pangkat/jabatan paling tinggi atas event tersebut, misalkan steering committee.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.21.</span><p><span className="font-black">OP (Official Partner)</span> merupakan merchant atau café yang bekerjasama dengan heroestix untuk menjualkan tiket dari event manager.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.22.</span><p><span className="font-black">Alamat Korespondensi</span> adalah alamat tujuan untuk keperluan surat menyurat.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">1.23.</span><p><span className="font-black">Man Power</span> adalah perwakilan dari Heroestix Indonesia sebagai pendamping Event Manager dalam hal teknis penukaran tiket atau validasi tiket (event). Man Power bukan sebagai tenaga yang diwajibkan untuk melakukan penukaran tiket atau validasi (scan) tiket.</p></div>
                    </div>
                </div>

                {/* Pasal 2 */}
                <div className="space-y-3 text-justify">
                    <h5 className="font-black text-slate-900 uppercase">Pasal 2: Proses Pendaftaran dan Persyaratan</h5>
                    <div className="space-y-2 pl-4">
                        <div className="flex gap-2"><span className="w-8 shrink-0">2.1.</span><p>Transaksi internet hanya dapat dilakukan melalui situs platform provider, dengan alamat URL yang dicantumkan dalam Perjanjian, yaitu admin.heroestix.com dan heroestix.com.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">2.2.</span><p>Event Manager berjanji untuk tidak menjual tiket atau jasa yang melanggar hukum/peraturan perundang-undangan/ketertiban umum dan/atau yang secara spesifik dilarang oleh Bank, Service Provider atau Principal.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">2.3.</span><p>Event manager wajib memberikan pemberitahuan tertulis kepada platform provider apabila Event Manager merubah jenis event dan/atau nama (event) yang ditawarkan, serta dalam hal terjadi perubahan dalam susunan kepemilikan, direksi atau penanggung jawab event manager dan/atau perubahan data-data lainnya, selambat-lambatnya 3 (tiga) hari setelah terjadinya perubahan.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">2.4.</span><p>Dalam hal event manager tidak memenuhi kewajibannya berdasarkan pasal ini, maka Heroestix Indonesia berhak untuk memblokir dana dan seluruh aktivitas penjualan.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">2.5.</span><div className="space-y-1"><p>Platform Manager dapat menolak memberikan layanan dan memutus Kerjasama kepada Event Manger dengan kategori sebagai berikut:</p>
                            <div className="pl-4 space-y-1">
                                <p>2.5.1. Terlibat tindakan kriminal atau melanggar norma hukum, sosial, agama dan moral.</p>
                                <p>2.5.2. Terlibat dalam kelompok atau organisasi terlarang.</p>
                                <p>2.5.3. Masuk ke dalam daftar hitam Platform Provider, Komunitas/serikat, Bank atau Service Provider.</p>
                                <p>2.5.4. Pertimbangan jelas lain yang ditentukan oleh (Platform Manager).</p>
                            </div>
                        </div></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">2.6.</span><p>Jika perubahan data sesuai dengan poin 2.3 dilakukan saat kondisi (event) sudah (listing) atau berstatus online di website resmi Heroestix Indonesia, Heroestix Indonesia berhak untuk menonaktifkan (event) tersebut tanpa pemberitahuan kepada (Event Manager). Pengaktifan (event) akan dilakukan ketika persyaratan telah dilengkapi dan telah melalui tahap pengecekan serta validasi oleh tim Heroestix Indonesia.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">2.7.</span><p>Event Manager wajib memberitahukan minimal dua hari sebelum mengumumkan kepada Heroestix Indonesia baik karena masalah batal internal maupun force majeure. Untuk organisasi yang tidak berbentuk badan wajib melampirkan foto KTP penanggung jawab/ketua event dan buku rekening bendahara yang tertera pada form kebutuhan MoU.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">2.8.</span><p>Untuk organisasi yang berbentuk badan wajib melampirkan akta perusahaan, NIB, NPWP Perusahaan, KTP Direktur, dan Foto Buku Rekening pada form kebutuhan MoU.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">2.9.</span><p>Event Manager setuju untuk menggunakan (sarana digital) sebagai bukti tercapainya kesepakatan pada peraturan yang tertuang pada Perjanjian Kerjasama dan secara sadar menyetujui bahwa (sarana digital) tersebut dapat digunakan sebagai alat bukti hukum yang sah jika terjadi sengketa atau pelanggaran kesepakatan.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">2.10.</span><p>Event Manager bersedia untuk mengundang minimal dua orang kedalam grup aplikasi "whatsapp" dan segala tujuan penarikan hasil penjualan harus melalui grup tersebut dengan menggunakan template yang akan disediakan oleh tim Heroestix Indonesia.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">2.11.</span><p>Jika dalam maksimal 2 jam dan/atau lebih dari 1 anggota telah membaca permintaan penarikan tersebut tidak ada protes dari anggota (Event Manager) yang lain, maka kami menganggap bahwa permintaan tersebut merupakan tindakan yang sah dan Event Manager bersedia untuk membebaskan (Platform Provider) dari segala tuntutan jika terjadi penggelapan hasil penjualan atau fraud.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">2.12.</span><p>Event Manager bersedia menjadikan grup aplikasi "whatsapp" sebagai alat bukti yang sah jika terjadi penggelapan uang penjualan atau pelanggaran hukum lainnya.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">2.13.</span><p>Pembatalan Event baik disebabkan oleh force majeure dan/atau permasalahan internal dari Event manager harus memberikan konfirmasi dan pemberitahuan kepada Heroestix Indonesia dan bersedia untuk membuat konferensi pers atau pengumuman baik melalui media online maupun cetak  yang menyatakan bahwa Heroestix Indonesia tidak terlibat dalam proses Refund dan melapaskan segala tuntutan yang ditujukan pada Heroestix Indonesia.</p></div>
                    </div>
                </div>

                {/* Pasal 3 */}
                <div className="space-y-3 text-justify">
                    <h5 className="font-black text-slate-900 uppercase">Pasal 3: Hak Dan Kewajiban Platform Provider</h5>
                    <div className="space-y-2 pl-4">
                        <div className="flex gap-2"><span className="w-8 shrink-0">3.1.</span><div className="space-y-1"><p>Hak Platform Provider, selain hak-hak yang telah dinyatakan dalam pasal-pasal lain Perjanjian ini adalah:</p>
                            <div className="pl-4 space-y-2">
                                <p>3.1.1. Menerima pembayaran Biaya Transaksi untuk setiap Transaksi yang berhasil atau sesuai dengan perjanjian awal yang telah disepakati bersama, yaitu: Rp0,-</p>
                                <div className="space-y-1">
                                    <p>3.1.2. Menerima biaya penggunaan sistem/system fee per event sebesar biaya kesepakatan dengan skema pembayaran:</p>
                                    <div className="pl-4"><p>a. Termin 1 (DP)</p><p>b. Termin 2 (Pelunasan)</p><p>Atau</p><p>c. Langsung Lunas</p></div>
                                </div>
                                <p>3.1.3. Membatasi, memblokir, memperlambat, menghapus dan/atau mengakhiri layanan Sistem Internet dan mengambil langkah-langkah hukum yang diperlukan apabila (Event Manager) dinilai telah melakukan pelanggaran baik berdasarkan perjanjian ini maupun hukum lainnya yang berlaku.</p>
                                <div className="space-y-1">
                                    <p>3.1.4. [Hanya berlaku jika melakukan pemesanan (merchandise) atau (bahan cetak) di Heroestix Indonesia] Berhak untuk menagih pembayaran sebagian atau pelunasan perihal pemesanan (merchandise) dan/atau (bahan cetak) pada saat proses produksi akan dilakukan:</p>
                                    <div className="pl-4 space-y-1">
                                        <p>a. Proses pembuatan akan dilakukan ketika sudah ada kesepakatan jumlah dan jenis (merchandise) atau (bahan cetak) yang dipesan disertai pelunasan pembayaran biaya pembuatan (merchandise) sebelum masuk produksi.</p>
                                        <p>b. Proses permintaan (bahan cetak) baik dilengkapi dengan QR maupun tidak, maksimal pemesanan adalah H-14 sebelum (merchandise) atau (bahan cetak) digunakan, jika terjadi keterlambatan pembuatan atau pengiriman yang disebabkan waktu pemesanan melebihi ketentuan, maka bukan tanggung jawab Heroestix Indonesia.</p>
                                        <p>c. Proses permintaan (bahan cetak) baik dilengkapi dengan QR maupun tidak, maksimal pemesanan adalah H-7 acara, jika terjadi keterlambatan pembuatan atau pengiriman yang disebabkan waktu pemesanan melebihi ketentuan, maka bukan tanggung jawab Heroestix Indonesia.</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p>3.1.5. [Hanya berlaku untuk (event) yang berada di luar Daerah Istimewa Yogyakarta dan membutuhkan pendampingan secara langsung dari Heroestix Indonesia] (Man Power) yang berangkat ke luar dari Daerah Istimewa Yogyakarta, dalam hal ini untuk pendampingan (event) sesuai yang telah disepakati antara Heroestix Indonesia dan (event manager), berhak untuk mendapatkan:</p>
                                    <div className="pl-4 space-y-1">
                                        <p>1. Fasilitas tiket pulang pergi (bisa menggunakan kereta minimal kelas eksekutif atau transportasi lain sesuai kesepakatan bersama) dari Yogyakarta ke kota penyelenggaraan (event) dan sebaliknya. Untuk tiket pulang pergi harus sudah disediakan maksimal H-2 keberangkatan.</p>
                                        <p>2. Biaya operasional untuk (man power) Heroestix Indonesia Rp. 500.000/per hari untuk satu orang, terhitung dari keberangkatan ke kota penyelenggara (event) sampai kembali ke Daerah Istimewa Yogyakarta.</p>
                                        <p>3. Fasilitas hotel/penginapan yang layak selama (event) berlangsung, terhitug dari berangkat ke kota penyelenggara (event) sampai kembali ke Daerah Istimewa Yogyakarta. Untuk hotel syaratnya tidak sharing dengan tim yang lain.</p>
                                        <p>4. Fasilitas transportasi pendukung dari hotel/penginapan ke lokasi venue (event) yang berlangsung, terhitung dari berangkat ke kota penyelenggara event sampai kembali ke Daerah Istimewa Yogyakarta.</p>
                                        <p className="italic pt-2">Untuk semua hak yang yang akan didapatkan oleh (Man Power), harus sudah disediakan dan dibayarkan sebelum keberangkatan Man Power ke kota penyelenggaraan (event). Atau (event manager) dapat membayarkan semua hak (Man Power) setelah penyelenggaraan event selesai dilakukan, namun harus atas dasar kesepakatan antara Heroestix Indonesia dan Event Manager</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p>3.1.6. Berhak untuk menegur dan/atau menuntut (event manager) jika tidak memenuhi kesepakatan yang telah dibuat sebagai bagian dari perjanjian Kerjasama atau dapat disebut kontraprestasi, yang mana adalah sebagai berikut:</p>
                                    <div className="pl-4 space-y-1">
                                        <p>a. Penyertaan logo heroestix pada poster, backdrop, dan media sosial sebagai ticketing partner.</p>
                                        <p>b. Penayangan logo pada layar proyektor atau running picture, satu slide khusus untuk ticketing partner, logo Heroestix berada paling atas dengan proporsi paling besar dan tidak ada logo lain di bagian kanan atau kirinya. Logo official partner (apabila menggunakan official partner) berada di bawah logo heroestix (optional).</p>
                                        <p>c. Penyampaian atau adlips oleh MC.</p>
                                        <p>d. Penyertaan pada aftermovie.</p>
                                        <p>e. Wajib menyertakan link tiket pada bio instagram.</p>
                                        <p>f. Wajib tag official account instagram Heroestix Indonesia ketika post story dan feed.</p>
                                        <p>g. Bersedia menyediakan konsumsi bagi team Heroestix Indonesia yang bertugas di lapangan, untuk jumlah tim Heroestix Indonesia yang bertugas akan dikonfirmasi ulang sebelum hari H acara.</p>
                                        <p>h. Memberikan fasilitas all access bagi tim media Heroestix Indonesia untuk pengambilan dokumentasi acara, untuk jumlah tim Heroestix Indonesia yang bertugas akan dikonfirmasi ulang sebelum hari H acara.</p>
                                        <p>i. Wajib mencantumkan logo official partner, tag, dan sertakan pada caption disetiap media publikasi yang telah disepakati.</p>
                                    </div>
                                </div>
                            </div>
                        </div></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">3.2.</span><div className="space-y-1"><p>Kewajiban Platform Provider, selain kewajiban-kewajiban yang telah dinyatakan dalam pasal-pasal lain Perjanjian ini adalah:</p>
                            <div className="pl-4 space-y-1">
                                <p>3.2.1. Mengelola dan merawat Sistem Internet agar tetap lancar dan kooperasional.</p>
                                <p>3.2.2. Menyediakan custom landing page untuk penjualan tiket bagi (event manager). Ini merupakan (fitur khusus), hanya dibuat jika ada permintaan dari event manager. (biaya custom landing page diluar system fee).</p>
                                <p>3.2.3. Menyediakan website untuk (listing) event.</p>
                                <p>3.2.4. Menyediakan permintaan custom domain bagi event manager. Ini merupakan (fitur khusus), hanya dibuat jika ada permintaan dari (event manager). Biaya custom domain diluar system fee.</p>
                                <p>3.2.5. Menyediakan rekonsiliasi data Transaksi Internet untuk Event Manager.</p>
                                <p>3.2.6. Memberikan informasi kepada Event Manager terkait status Transaksi Internet.</p>
                                <p>3.2.7. Memberikan dukungan teknis atau operasional kepada Event Manager apabila diperlukan.</p>
                                <p>3.2.8. Menyiapkan system yang dibutuhkan oleh Event Manager sesuai dengan kesepakatan.</p>
                                <p>3.2.9. Bertanggung jawab atas masalah yang timbul atau hilangnya data yang dikarenakan oleh kegagalan system.</p>
                            </div>
                        </div></div>
                    </div>
                </div>

                {/* Pasal 4 */}
                <div className="space-y-3 text-justify">
                    <h5 className="font-black text-slate-900 uppercase">Pasal 4: Hak dan Kewajiban Event Manager</h5>
                    <div className="space-y-2 pl-4">
                        <div className="flex gap-2"><span className="w-8 shrink-0">4.1.</span><div className="space-y-1"><p>Hak Event Manager, selain hak-hak yang telah dinyatakan dalam pasal-pasal lain Perjanjian ini adalah:</p>
                            <div className="pl-4 space-y-1">
                                <p>4.1.1. Mendapatkan dukungan teknis maupun operasional dari Platform Provider.</p>
                                <p>4.1.2. Mendapatkan akun yang digunakan sebagai identitas Event Manager.</p>
                                <p>4.1.3. Menerima informasi status Transaksi Internet.</p>
                                <p>4.1.4. (Listing) acara pada situs resmi Heroestix Indonesia.</p>
                                <p>4.1.5. Mendapatkan website untuk event online jika terjadi kesepakatan untuk pembuatan custom website (fitur khusus).</p>
                                <p>4.1.6. Menerima pendapatan penjualan tiket melalui website Heroestix Indonesia.</p>
                                <p>4.1.7. Menerima edukasi atau demo terkait penggunaan layanan dan pengoperasian Sistem Administrasi dan Sistem Pembayaran Internet.</p>
                                <p>4.1.8. Mendapatkan fasilitas penjualan pada Official Partner yang tersedia tanpa potongan atau komisi prosentase penjualan tiket.</p>
                            </div>
                        </div></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">4.2.</span><div className="space-y-1"><p>Kewajiban Event Manager, selain kewajiban-kewajiban yang telah dinyatakan dalam pasal-pasal lain Perjanjian ini adalah:</p>
                            <div className="pl-4 space-y-1">
                                <p>4.2.1. Memberikan deskripsi acara, banner, serta informasi lainnya secara benar dan sesuai dengan keadaan yang sesungguhnya serta sesuai dengan ketentuan parameter input pada sistem admin.</p>
                                <p>4.2.2. Menjaga akun yang diberikan oleh (Platform Manager) untuk tidak digunakan sembarangan.</p>
                                <p>4.2.3. Memenuhi kesepakatan atau kontraprestasi yang telah disepakati bersama.</p>
                                <p>4.2.4. Wajib melaporkan kepada Platform Manager jika terjadi penyelewengan data.</p>
                                <p>4.2.5. Mematuhi ketentuan dan persyaratan dari masing-masing Layanan Pembayaran yang telah ditetapkan oleh Bank dan Service Provider.</p>
                                <p>4.2.6. Event Manager DILARANG KERAS menyalahgunakan data pembeli yang terdaftar di sistem. Jika terjadi penyalahgunaan, maka Platform Provider akan menempuh jalur hukum dan (Event Manager) bersedia untuk dilaporkan atas tuduhan pelanggaran privasi.</p>
                            </div>
                        </div></div>
                    </div>
                </div>

                {/* Pasal 5 */}
                <div className="space-y-3 text-justify">
                    <h5 className="font-black text-slate-900 uppercase">Pasal 5: Prosedur Operasi Standar (SOP)</h5>
                    <div className="space-y-2 pl-4">
                        <div className="flex gap-2"><span className="w-8 shrink-0">5.1.</span><div className="space-y-1"><p>Laporan Rekapitulasi Transaksi Internet</p>
                            <div className="pl-4 space-y-1">
                                <p>5.1.1. (Event Manager) berhak untuk melaporkan pihak (Platform Provider) jika terjadi pelanggaran yang dilakukan oleh pihak tersebut.</p>
                                <p>5.1.2. (Event Manager) dapat mengakses laporan dan status Transaksi Internet melalui sistem admin Heroestix Indonesia.</p>
                                <p>5.1.3. (Event Manager) dapat mendapatkan laporan rekapitulasi transaksi harian dalam format excel yang dapat diunduh sesuai dengan kebutuhan (Event Manager).</p>
                                <p>5.1.4. (Event Manager) dapat mengambil hasil penjualan tiket di (Official Partner) dengan menggunakan kode verifikasi yang telah tersedia di akun admin dan mengisi keterangan tambahan.</p>
                                <p>5.1.5. (Event Manager) tidak dapat melakukan penarikan habis pada hasil penjualan secara online apabila belum melunasi biaya sistem sesuai dengan kesepakatan pada Pasal 3 butir 3.1.2.</p>
                                <p>5.1.6. Batas pengambilan hasil penjualan di (Official Partner) adalah H+7, jika lebih dari itu maka uang penjualan menjadi HAK Heroestix Indonesia dan tidak dapat dicairkan atau diminta oleh (Event Manager).</p>
                                <p>5.1.7. (Platform Manager) tidak menyediakan jaringan internet. Apabila terjadi kegagalan transaksi akibat dari koneksi yang dimiliki oleh (Event Manager), bukan tanggung jawab (Platform Manager).</p>
                                <p>5.1.8. (Platform Provider) bersedia untuk membantu kegagalan transaksi yang diakibatkan oleh pihak (Event Manager) dengan catatan transaksi atau data tidak hilang secara permanen, dan bila tidak dapat dipulihkan, (Platform Provider) tidak bertanggung jawab atas kejadian tersebut.</p>
                                <p>5.1.9. Refund yang dilakukan oleh (Platform Manager) jika terjadi kegagalan pada sistem bayar dari bank, bukan karena pembatalan tiket yang dilakukan oleh pemilik tiket.</p>
                                <p>5.1.10. Jika pemilik tiket akan memberikan atau menjual tiket yang dimilikinya, maka harus memberitahukan kepada (Event Manager) terlebih dahulu agar dapat dilakukan perubahan data atau informasi pemegang tiket. Jika terdapat kendala dalam perubahan informasi pemilik tiket, (Platform Provider) akan membantu proses pembetulan data tersebut.</p>
                                <p>5.1.11. Jika terjadi kegagalan transaksi pada Virtual Account Bank tertentu, akan dikerjakan maksimal 3 hari kerja setelah adanya laporan kepada pihak (Platform Provider) dan akan diberikan penjelasan terkait dari kegagalan tersebut langsung dari pihak bank atau Payment Gateway.</p>
                                <p>5.1.12. (Event Manager) dapat mengajukan permohonan penarikan/pengambilan dana transaksi yang dilakukan melalui store Heroestix Indonesia atau situs resmi Heroestix Indonesia kapanpun tanpa minimal transaksi.</p>
                                <p>5.1.13. Penarikan dana atau hasil penjualan dilayani saat jam kerja operasional bank, dana akan dipindahkan oleh Heroestix Indonesia ke nomer rekening yang telah disepakati dan ditulis pada template penarikan pada grup whatsapp.</p>
                                <p>5.1.14. Jika waktu penarikan dilakukan pada bukan hari kerja, maka Heroestix Indonesia berhak untuk melakukan proses tersebut pada hari selanjutnya atau pada hari kerja.</p>
                                <p>5.1.15. Batas maksimal pengambilan/penarikan dana adalah H+6 acara, jika melebihi dari hari tersebut, maka dana tersebut menjadi hak milik Heroestix.</p>
                                <p>5.1.16. (Platform Manager) berhak menahan pencairan dana kepada (Event Manager) dalam hal terdapat kecurigaan dari Platform Provider/Bank/Principal atas adanya penipuan (fraud) yang dilakukan oleh (Event Manager). Dalam hal terdapat kecurigaan tersebut, maka (Event Manager) wajib untuk memberikan dokumen-dokumen yang dapat membuktikan bahwa (Event Manager) tidak melakukan penipuan (fraud). Dalam hal (Event Manager) tidak berhasil memberikan bukti, maka Platform Provider berhak untuk melakukan Refund atas seluruh Transaksi Internet yang telah dilakukan dan (Platform Manager) dapat melakukan tindakan hukum apapun termasuk pengakhiran Perjanjian.</p>
                                <p>5.1.17. Jika terjadi pembatalan (event), maka segala uang tiket yang sudah ditransfer menjadi tanggung jawab (event manager) dan uang yang belum di withdraw akan dibekukan sementara sampai ada kejelasan dan penyelesaian masalah. Dan jika ada mekanisme refund ke pembeli, maka proses ini merupakan tanggung jawab dan tugas (event manager).</p>
                            </div>
                        </div></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">5.2.</span><div className="space-y-1"><p>Ketentuan Refund dan sanksi pembatalan.</p>
                            <div className="pl-4 space-y-1">
                                <p>5.2.1. Platform Provider hanya melakukan Refund jika terjadi kegagalan pembayaran yang dikarenakan oleh sistem.</p>
                                <p>5.2.2. Jika customer memaksa ingin melakukan Refund, maka segala keputusan refund adalah wewenang (Event Manager). Proses tersebut akan dilakukan sendiri oleh (Event Manager).</p>
                                <p>5.2.3. Jika terjadi pembatalan penggunaan sistem setelah terjadi kesepakatan secara verbal maupun non verbal atau sudah membayarkan biaya sewa sistem atau permintaan fitur yang telah dibuat dan/atau sudah melakukan penandatanganan MoU, maka (Event Manager) tetap harus membayarkan uang biaya sewa sesuai kesepakatan.</p>
                                <p>5.2.4. Jika (Event Manager) tidak membayarkan biaya sewa sistem saat melakukan pembatalan dan/atau biaya lainnya yang sudah disepakati, maka (Event Manager) bersedia untuk dilaporkan kepada pihak berwajib dengan tuntutan penipuan dan penggelapan dana.</p>
                            </div>
                        </div></div>
                    </div>
                </div>

                {/* Pasal 6 */}
                <div className="space-y-3 text-justify">
                    <h5 className="font-black text-slate-900 uppercase">Pasal 6: Penghentian Sementara Layanan Sistem Pembayaran Internet</h5>
                    <div className="space-y-2 pl-4">
                        <div className="flex gap-2"><span className="w-8 shrink-0">6.1.</span><p>Platform Provider dapat setiap saat menghentikan/mematikan Sistem Internet untuk sementara waktu dengan pemberitahuan selambat-lambatnya 2 (dua) Hari Kerja sebelumnya kepada (Event Manager).</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">6.2.</span><div className="space-y-1"><p>Penghentian layanan Sistem Pembayaran Internet dapat disebabkan oleh alasan-alasan sebagai berikut:</p>
                            <div className="pl-4 space-y-1">
                                <p>6.2.1. Inspeksi, perbaikan, pemeliharaan atau peningkatan sistem.</p>
                                <p>6.2.2. Adanya alasan tertentu berupa melindungi hak-hak dan/atau kepentingan Para Pihak; atau alasan jelas lain yang ditentukan oleh Platform Provider, Bank, atau Customer.</p>
                            </div>
                        </div></div>
                    </div>
                </div>

                {/* Pasal 7 */}
                <div className="space-y-3 text-justify">
                    <h5 className="font-black text-slate-900 uppercase">Pasal 7: Domisili Hukum dan Penyelesaian Sengketa</h5>
                    <div className="space-y-2 pl-4">
                        <div className="flex gap-2"><span className="w-8 shrink-0">7.1.</span><p>Perjanjian ini diatur dan tunduk pada hukum yang berlaku di Negara Republik Indonesia.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">7.2.</span><p>Apabila dalam pelaksanaan Perjanjian ini terjadi perbedaan pendapat dan/atau penafsiran maupun terjadi perselisihan diantara Para Pihak dalam Perjanjian ini, maka Para Pihak sepakat untuk menyelesaikannya secara musyawarah dengan itikad baik untuk mencapai mufakat. Apabila musyawarah mufakat tidak tercapai, maka Para Pihak sepakat memilih kedudukan hukum yang tetap dan seumumnya di Kantor Kepaniteraan Pengadilan Negeri Kota Yogyakarta sebagai sarana penyelesaian perselisihan tersebut.</p></div>
                    </div>
                </div>

                {/* Pasal 8 */}
                <div className="space-y-3 text-justify">
                    <h5 className="font-black text-slate-900 uppercase">Pasal 8: Ketentuan Lainnya</h5>
                    <div className="space-y-2 pl-4">
                        <div className="flex gap-2"><span className="w-8 shrink-0">8.1.</span><p><span className="font-black">Lampiran.</span> Segala Lampiran, Addendum, Surat Komunikasi, serta dokumen-dokumen lainnya yang dibuat berdasarkan atau sehubungan dengan Perjanjian ini, merupakan bagian integral dari dan menjadi lampiran yang tidak terpisahkan dari Perjanjian ini.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">8.2.</span><p><span className="font-black">Perubahan.</span> Perjanjian ini tidak boleh diubah atau ditambah kecuali disetujui oleh Para Pihak dan termaktub dalam perjanjian formal yang ditandatangani oleh Para Pihak.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">8.3.</span><p><span className="font-black">Addendum.</span> Hal-hal yang tidak atau belum diatur dalam atau perubahan atas Perjanjian ini, akan diatur kemudian melalui addendum yang disepakati dan ditandatangani oleh Para Pihak; addendum mana menjadi bagian integral dan menjadi lampiran yang tidak terpisahkan dari Perjanjian ini.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">8.4.</span><p><span className="font-black">Pelepasan Hak.</span> Dalam hal terjadi kegagalan, penundaan atau keterlambatan oleh salah satu Pihak dalam melaksanakan haknya atau menuntut pemenuhan kewajiban dari Pihak lainnya berdasarkan Perjanjian ini, maka kegagalan, penundaan atau keterlambatan tersebut bukan merupakan pelepasan hak oleh pihak tersebut untuk dikemudian hari melaksanakan haknya atau menuntut pemenuhan kewajiban pihak lainnya berdasarkan Perjanjian ini.</p></div>
                        <div className="flex gap-2"><span className="w-8 shrink-0">8.5.</span><p><span className="font-black">Tidak Ada Pengalihan.</span> Perjanjian ini mengikat dan dibuat untuk kepentingan dari setiap Pihak dan penerima dan/atau pengganti haknya masing-masing, akan tetapi dengan ketentuan, bahwa tidak ada Pihak yang boleh mengalihkan setiap hak-hak yang timbul dari atau berkenaan dengan Perjanjian ini kepada pihak ketiga manapun, tanpa persetujuan tertulis terlebih dahulu dari Pihak lainnya.</p></div>
                    </div>
                </div>

                {/* Kesepakatan Akhir & Tanda Tangan */}
                <div className="pt-12 mt-8 border-t border-slate-200">
                    <h4 className="font-black text-center text-slate-900 uppercase text-xs mb-8">PERSETUJUAN EVENT MANAGER</h4>
                    <div className="space-y-4 text-justify font-medium mb-12">
                        <ul className="list-disc pl-4 space-y-2">
                            <li>Saya/kami dengan ini menyatakan bahwa keterangan ini dibuat dengan sebenarnya untuk mengajukan permohonan sebagai client Heroestix Indonesia. Sebagai client Heroestix Indonesia, saya/kami akan bertanggung jawab sepenuhnya atas perjanjian yang sudah dibuat serta peraturan yang berlaku.</li>
                            <li>Saya/kami menyetujui seluruh pasal dan butir yang ada dalam perjanjian ini walaupun tanpa adanya paraf pada masing-masing halaman jika proses penandatanganan menggunakan (sarana digital).</li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-center pt-4">
                        <div className="space-y-20">
                            <div className="space-y-1">
                                <p className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em]">Platform Provider</p>
                                <p className="font-black text-blue-600 uppercase text-xs">Heroestix Indonesia</p>
                            </div>
                            <div className="space-y-1">
                                <div className="w-40 h-px bg-slate-300 mx-auto mb-2" />
                                <p className="font-black text-slate-900 uppercase text-[10px]">Brian Ellia Aryanto / Bima Dwi Kurnianto</p>
                                <p className="font-bold text-slate-400 text-[9px] uppercase">CEO / BOD</p>
                            </div>
                        </div>
                        <div className="space-y-20">
                            <div className="space-y-1">
                                <p className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em]">Event Manager</p>
                                <p className="font-black text-slate-900 uppercase text-xs">{data?.brand_name || <span className="bg-yellow-200 text-yellow-800 px-1 rounded normal-case">Diisi Dari Pemberkasan</span>}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="w-40 h-px bg-slate-300 mx-auto mb-2" />
                                <p className="font-black text-slate-900 uppercase text-[10px]">{data?.director_name || <span className="bg-yellow-200 text-yellow-800 px-1 rounded normal-case">Diisi Dari Pemberkasan</span>}</p>
                                <p className="font-bold text-slate-400 text-[9px] uppercase">Principle / Ketua Event</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lampiran Dokumen */}
                <div className="mt-12 p-6 bg-white border border-slate-200 rounded-[2rem] text-slate-800 space-y-6 shadow-sm">
                    <div className="flex flex-col items-center justify-center gap-3 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <FileText size={20} />
                        </div>
                        <h5 className="font-black uppercase tracking-widest text-[11px] text-center text-slate-900">LAMPIRAN DOKUMEN WAJIB YANG DIUPLOAD DI SECTION PEMBERKASAN</h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[9px]">
                        <div className="space-y-4">
                            <p className="font-black text-blue-600 uppercase tracking-wider text-[10px] border-l-2 border-blue-600 pl-2">Apabila Organisasi Berbentuk Badan</p>
                            <ul className="space-y-3 font-bold text-slate-600 uppercase">
                                <li className="flex items-center gap-2"><Image size={14} className="text-slate-400" /> AKTA PERUSAHAAN</li>
                                <li className="flex items-center gap-2"><Image size={14} className="text-slate-400" /> NIB</li>
                                <li className="flex items-center gap-2"><Image size={14} className="text-slate-400" /> NPWP</li>
                                <li className="flex items-center gap-2"><Image size={14} className="text-slate-400" /> KTP DIREKTUR</li>
                                <li className="flex items-center gap-2"><Image size={14} className="text-slate-400" /> FOTO BUKU REKENING PERUSAHAAN</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <p className="font-black text-blue-600 uppercase tracking-wider text-[10px] border-l-2 border-blue-600 pl-2">Apabila Organisasi Tidak Berbentuk Badan</p>
                            <ul className="space-y-3 font-bold text-slate-600 uppercase">
                                <li className="flex items-center gap-2"><Image size={14} className="text-slate-400" /> KTP PENANGGUNG JAWAB EVENT</li>
                                <li className="flex items-center gap-2"><Image size={14} className="text-slate-400" /> FOTO BUKU REKENING</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MOUDocument;
