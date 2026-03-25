/**
 * Native PDF Generator for Heroestix MOU
 * Uses pdfMake for high-quality, selectable text PDF generation.
 */

const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

const getBase64FromUrl = async (url) => {
    if (!url) return null;
    
    // If it's already a full data URL, just return it
    if (url.startsWith('data:image/')) return url;

    // If it's a raw base64 string (starts with common JPEG/PNG headers), wrap it
    if (url.startsWith('9j/') || url.startsWith('iVBORw0KGgo')) {
        return `data:image/jpeg;base64,${url}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                let base64String = reader.result;
                // Double check if prefix is missing for some reason
                if (base64String && !base64String.startsWith('data:image/')) {
                    const mimeType = blob.type || 'image/jpeg';
                    base64String = `data:${mimeType};base64,${base64String}`;
                }
                resolve(base64String);
            };
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Failed to convert image for PDF:", url, e);
        return null;
    }
};

export const generateMOUPDF = async (data) => {
    try {
        // Load pdfMake from CDN if not already loaded
        if (!window.pdfMake || !window.pdfMake.createPdf) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js');
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js');
        }

        const pdfMake = window.pdfMake;

        const attachments = {};

        // Helper to map document keys to readable labels
        const DOC_LABELS = {
            akte_notaris_url: 'Akta Perusahaan',
            nib_url: 'NIB',
            npwp_pic_url: 'NPWP',
            npwp_company_url: 'NPWP Perusahaan',
            ktp_pic_url: 'KTP Direktur',
            bank_book_pic_url: 'Foto Buku Rekening Perusahaan'
        };

        try {
            // Only fetch document images — fonts use built-in Roboto from vfs_fonts.js
            const imageKeys = Object.keys(DOC_LABELS);
            const fetchTasks = [];

            imageKeys.forEach(key => {
                if (data?.[key]) {
                    fetchTasks.push(getBase64FromUrl(data[key]).then(b64 => ({ key, b64 })));
                }
            });

            const results = await Promise.all(fetchTasks);

            results.forEach(res => {
                if (res && res.key) attachments[res.key] = res.b64;
            });
        } catch (e) {
            console.warn('PDF image fetch failed:', e);
        }

        // Use built-in Roboto from vfs_fonts.js (no external font loading needed)
        const defaultFont = 'Roboto';

        const docDefinition = {
            pageSize: 'A4',
            pageMargins: [60, 60, 60, 60],
            defaultStyle: {
                font: defaultFont,
                columnGap: 20,
                color: 'black',
                lineHeight: 1.5
            },
            content: [
                // Header
                {
                    text: 'PERJANJIAN KERJASAMA PLATFORM HEROESTIX INDONESIA',
                    style: 'header',
                    alignment: 'center'
                },
                {
                    text: 'Nomor: [YANG MENGISI PIHAK HEROESTIX]',
                    style: 'subHeader',
                    alignment: 'center',
                    margin: [0, 5, 0, 0]
                },
                {
                    text: `Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                    style: 'subHeader',
                    alignment: 'center',
                    margin: [0, 5, 0, 30]
                },

                // Pihak 1: Platform Provider
                {
                    text: '1. PLATFORM PROVIDER',
                    style: 'sectionTitle'
                },
                {
                    stack: [
                        { text: 'HEROESTIX INDONESIA', style: 'infoTitle' },
                        { text: 'Akta Pendirian Nomor 40', style: 'infoText' },
                        { text: 'SK KEMENKUMHAM No. AHU-0037234-AH.01.14', style: 'infoText' },
                        { 
                            text: 'Jl. Rajawali, Perumahan Citra Graha, Drono, No 2, Drono, Sardonoharjo, Kec. Ngaglik, Kab.Sleman, Daerah Istimewa Yogyakarta 55581',
                            style: 'infoText',
                            margin: [0, 5, 0, 0]
                        },
                        { text: 'CEO: Brian Ellia Aryanto', style: 'infoText', margin: [0, 5, 0, 0] },
                        { text: 'BOD: Bima Dwi Kurnianto', style: 'infoText' }
                    ],
                    margin: [20, 10, 0, 20]
                },

                // Pihak 2: Event Manager
                {
                    text: '2. EVENT MANAGER',
                    style: 'sectionTitle'
                },
                {
                    columns: [
                        {
                            width: '50%',
                            stack: [
                                { text: 'Nama Organisasi/Perusahaan', style: 'label' },
                                { text: data?.brand_name || 'Diisi Dari Pemberkasan', style: 'value' },
                                { text: 'Alamat Korespondensi', style: 'label', margin: [0, 10, 0, 0] },
                                { text: data?.company_address || data?.address || 'Diisi Dari Pemberkasan', style: 'value' },
                            ]
                        },
                        {
                            width: '50%',
                            stack: [
                                { text: 'Penanggung Jawab (Ketua/Principle)', style: 'label' },
                                { text: data?.director_name || 'Diisi Dari Pemberkasan', style: 'value' },
                                { text: 'Nomor Telp/Lainnya', style: 'label', margin: [0, 10, 0, 0] },
                                { text: data?.phone || 'Diisi Dari Pemberkasan', style: 'value' },
                            ]
                        }
                    ],
                    margin: [20, 10, 0, 10]
                },
                {
                    text: 'Email Penanggung Jawab',
                    style: 'label',
                    margin: [20, 0, 0, 0]
                },
                {
                    text: data?.email || 'Diisi Dari Pemberkasan',
                    style: 'value',
                    margin: [20, 2, 0, 20]
                },

                // Data Rekening
                {
                    text: 'DATA REKENING',
                    style: 'sectionTitle',
                    alignment: 'center',
                    margin: [0, 10, 0, 10]
                },
                {
                    table: {
                        widths: ['*', '*', '*'],
                        body: [
                            [
                                { text: 'Bank', style: 'tableLabel' },
                                { text: 'Atas Nama', style: 'tableLabel' },
                                { text: 'Nomor Rekening', style: 'tableLabel' }
                            ],
                            [
                                { text: data?.bank_name || 'Diisi Dari Pemberkasan', style: 'tableValue' },
                                { text: data?.bank_account_holder || data?.bank_holder_name || 'Diisi Dari Pemberkasan', style: 'tableValue' },
                                { text: data?.bank_account_number || data?.bank_account || 'Diisi Dari Pemberkasan', style: 'tableValue' }
                            ]
                        ]
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 0, 0, 30]
                },

                {
                    text: 'Perjanjian ini berlaku dengan mengacu pada Syarat dan Ketentuan yang berlaku sebagai bagian integral dan satu kesatuan yang mengikat bersamaan dengan Perjanjian ini.',
                    style: 'paragraph',
                    margin: [0, 0, 0, 20]
                },

                {
                    text: 'Perjanjian beserta dengan Syarat dan Ketentuan ini disepakati dan ditandatangani Para Pihak dalam keadaan sadar, sehat jasmani dan rohani, serta tidak di bawah tekanan atau paksaan dari pihak manapun; Para Pihak sepakat untuk menaati dan melaksanakan Perjanjian ini dengan itikad baik. Demikian Perjanjian ini dibuat dan ditandatangani oleh Para Pihak di atas meterai secukupnya atau menggunakan (sarana digital); masing-masing rangkap memiliki kekuatan hukum yang sama dan berlaku sebagai alat bukti yang sah.',
                    style: 'paragraph',
                    margin: [0, 0, 0, 40],
                    pageBreak: 'after'
                },

                // T&C Section
                {
                    text: 'SYARAT DAN KETENTUAN BERLAKU',
                    style: 'tcTitle',
                    margin: [0, 0, 0, 20]
                },

                // Pasal 1
                { text: 'Pasal 1: Definisi', style: 'pasalTitle' },
                {
                    stack: [
                        { text: '1.1. Heroestix/Heroestix Indonesia merupakan suatu platform ticketing yang menyediakan dan mengintegrasikan kebutuhan event manager mulai dari transaksi online, on the spot, dan gate system, dimana berperan sebagai Platform Provider.', margin: [0, 2] },
                        { text: '1.2. Event Manager adalah kelompok atau organisasi atau badan hukum yang sah yang mana merupakan pembuat atau penanggungjawab dari sebuah acara atau (event) dan merupakan pihak yang terikat dalam Perjanjian Kerjasama ini.', margin: [0, 2] },
                        { text: '1.3. Biaya Langganan adalah biaya yang dikenakan oleh (Platform Provider) kepada (Event Manager) untuk setiap kontrak Kerjasama dengan nominal yang telah disepakati.', margin: [0, 2] },
                        { text: '1.4. Merchandise adalah barang pelengkap (event) yang dipesan bersama dan/atau diluar dengan pemakaian sistem administrasi Heroestix Indonesia. Merchandise dapat berupa seminar kit baik beserta sertifikat maupun tidak, kaos/kemeja/polo, mug, tumbler, dan barang pelengkap event lain yang disepakati diawal.', margin: [0, 2] },
                        { text: '1.5. Bahan Cetak adalah produksi perlengkapan acara yang melibatkan proses printing. Dalam hal ini adalah tiket gelang, banner, dan poster.', margin: [0, 2] },
                        { text: '1.6. Hari Kerja adalah hari selain Sabtu, Minggu, dan hari libur nasional, di mana bank-bank di Indonesia beroperasi untuk melakukan kegiatan finansial.', margin: [0, 2] },
                        { text: '1.7. Layanan Pembayaran adalah jenis-jenis metode pembayaran Transaksi Internet yang tersedia di Sistem Pembayaran Internet.', margin: [0, 2] },
                        { text: '1.8. Pelanggan adalah pelaku Transaksi Internet di (Merchant), melalui Sistem Pembayaran Internet.', margin: [0, 2] },
                        { text: '1.9. Merchant adalah toko online yang tersedia di website resmi Heroestix Indonesia dengan domain heroestix.com dan/atau sub-domain yang secara resmi telah dirilis oleh Heroestix Indonesia.', margin: [0, 2] },
                        { text: '1.10. Fitur Khusus merupakan permintaan fitur diluar dari fasilitas standar yang ada pada Heroestix Indonesia, fitur tersebut dapat berupa Custom Website, Custom Domain, atau permintaan khusus lainnya yang disepakati.', margin: [0, 2] },
                        { text: '1.11. Sarana Digital adalah penggunaan metode atau perantara untuk mendokumentasikan tanda tangan digital, paraf digital, pemindaian wajah atau biometrics yang ditujukan untuk pengesahan dokumen legalitas, yang mana tidak ditujukan untuk penggunaan pribadi yang merugikan kedua belah pihak. Alat pembuktian tersebut dapat berupa chat whatsapp, email, voice recording, maupun media digital lainnya.', margin: [0, 2] },
                        { text: '1.12. Event adalah produk dari (Event Manager) yang akan dijual melalui website resmi Heroestix Indonesia.', margin: [0, 2] },
                        { text: '1.13. Listing adalah proses pengaktifan produk dari (Event manager) sehingga dapat ditampilkan pada situs resmi Heroestix Indonesia.', margin: [0, 2] },
                        { text: '1.14. Internet Fee adalah biaya yang ditarik pada besaran tertentu sesuai dengan total transaksi yang terjadi dan akan digunakan oleh (Platform Provider) untuk proses verifikasi pembayaran online real-time kepada payment gateway serta biaya pemeliharaan sistem.', margin: [0, 2] },
                        { text: '1.15. Sistem Pembayaran Internet adalah sistem pembayaran yang dimiliki dan dikelola oleh Payment Gateway, yang menghubungkan antara Bank/Service Provider, Platform Provider, dan Event Manager.', margin: [0, 2] },
                        { text: '1.16. Tax atau Pajak merupakan pajak yang mengacu pada peraturan pemerintah pusat maupun daerah untuk suatu kejadian dan/atau transaksi yang secara perundang-undangan telah diatur untuk dipotong atau dipungut sesuai dengan tarif yang berlaku melalui website resmi Heroestix Indonesia.', margin: [0, 2] },
                        { text: '1.17. Service Provider adalah penyedia jasa metode pembayaran selain Bank, yang memiliki kerjasama dan telah terhubung dengan Payment Gateway.', margin: [0, 2] },
                        { text: '1.18. Platform Manager/Provider merupakan penyedia jasa sistem administrasi, dimana dalam hal ini adalah Heroestix Indonesia.', margin: [0, 2] },
                        { text: '1.19. Transaksi Internet adalah transaksi melalui media elektronik yang dilakukan oleh Pelanggan di situs (Merchant), dan diproses oleh Sistem Pembayaran Internet.', margin: [0, 2] },
                        { text: '1.20. PIC/Principle merupakan seorang yang paling bertanggung jawab atau memiliki pangkat/jabatan paling tinggi atas event tersebut, misalkan steering committee.', margin: [0, 2] },
                        { text: '1.21. OP (Official Partner) merupakan merchant atau café yang bekerjasama dengan heroestix untuk menjualkan tiket dari event manager.', margin: [0, 2] },
                        { text: '1.22. Alamat Korespondensi adalah alamat tujuan untuk keperluan surat menyurat.', margin: [0, 2] },
                        { text: '1.23. Man Power adalah perwakilan dari Heroestix Indonesia sebagai pendamping Event Manager dalam hal teknis penukaran tiket atau validasi tiket (event). Man Power bukan sebagai tenaga yang diwajibkan untuk melakukan penukaran tiket atau validasi (scan) tiket.', margin: [0, 2] }
                    ],
                    style: 'list',
                    margin: [20, 10, 0, 20]
                },

                // Pasal 2
                { text: 'Pasal 2: Proses Pendaftaran dan Persyaratan', style: 'pasalTitle' },
                {
                    stack: [
                        { text: '2.1. Transaksi internet hanya dapat dilakukan melalui situs platform provider, dengan alamat URL yang dicantumkan dalam Perjanjian, yaitu admin.heroestix.com dan heroestix.com.', margin: [0, 2] },
                        { text: '2.2. Event Manager berjanji untuk tidak menjual tiket atau jasa yang melanggar hukum/peraturan perundang-undangan/ketertiban umum dan/atau yang secara spesifik dilarang oleh Bank, Service Provider atau Principal.', margin: [0, 2] },
                        { text: '2.3. Event manager wajib memberikan pemberitahuan tertulis kepada platform provider apabila Event Manager merubah jenis event dan/atau nama (event) yang ditawarkan, serta dalam hal terjadi perubahan dalam susunan kepemilikan, direksi atau penanggung jawab event manager dan/atau perubahan data-data lainnya, selambat-lambatnya 3 (tiga) hari setelah terjadinya perubahan.', margin: [0, 2] },
                        { text: '2.4. Dalam hal event manager tidak memenuhi kewajibannya berdasarkan pasal ini, maka Heroestix Indonesia berhak untuk memblokir dana dan seluruh aktivitas penjualan.', margin: [0, 2] },
                        { text: '2.5. Platform Manager dapat menolak memberikan layanan dan memutus Kerjasama kepada Event Manger dengan kategori sebagai berikut:', margin: [0, 2] },
                        {
                            ul: [
                                '2.5.1. Terlibat tindakan kriminal atau melanggar norma hukum, sosial, agama dan moral.',
                                '2.5.2. Terlibat dalam kelompok atau organisasi terlarang.',
                                '2.5.3. Masuk ke dalam daftar hitam Platform Provider, Komunitas/serikat, Bank atau Service Provider.',
                                '2.5.4. Pertimbangan jelas lain yang ditentukan oleh (Platform Manager).'
                            ],
                            margin: [40, 2]
                        },
                        { text: '2.6. Jika perubahan data sesuai dengan poin 2.3 dilakukan saat kondisi (event) sudah (listing) atau berstatus online di website resmi Heroestix Indonesia, Heroestix Indonesia berhak untuk menonaktifkan (event) tersebut tanpa pemberitahuan kepada (Event Manager). Pengaktifan (event) akan dilakukan ketika persyaratan telah dilengkapi dan telah melalui tahap pengecekan serta validasi oleh tim Heroestix Indonesia.', margin: [0, 2] },
                        { text: '2.7. Event Manager wajib memberitahukan minimal dua hari sebelum mengumumkan kepada Heroestix Indonesia baik karena masalah batal internal maupun force majeure. Untuk organisasi yang tidak berbentuk badan wajib melampirkan foto KTP penanggung jawab/ketua event dan buku rekening bendahara yang tertera pada form kebutuhan MoU.', margin: [0, 2] },
                        { text: '2.8. Untuk organisasi yang berbentuk badan wajib melampirkan akta perusahaan, NIB, NPWP Perusahaan, KTP Direktur, dan Foto Buku Rekening pada form kebutuhan MoU.', margin: [0, 2] },
                        { text: '2.9. Event Manager setuju untuk menggunakan (sarana digital) sebagai bukti tercapainya kesepakatan pada peraturan yang tertuang pada Perjanjian Kerjasama dan secara sadar menyetujui bahwa (sarana digital) tersebut dapat digunakan sebagai alat bukti hukum yang sah jika terjadi sengketa atau pelanggaran kesepakatan.', margin: [0, 2] },
                        { text: '2.10. Event Manager bersedia untuk mengundang minimal dua orang kedalam grup aplikasi "whatsapp" dan segala tujuan penarikan hasil penjualan harus melalui grup tersebut dengan menggunakan template yang akan disediakan oleh tim Heroestix Indonesia.', margin: [0, 2] },
                        { text: '2.11. Jika dalam maksimal 2 jam dan/atau lebih dari 1 anggota telah membaca permintaan penarikan tersebut tidak ada protes dari anggota (Event Manager) yang lain, maka kami menganggap bahwa permintaan tersebut merupakan tindakan yang sah dan Event Manager bersedia untuk membebaskan (Platform Provider) dari segala tuntutan jika terjadi penggelapan hasil penjualan atau fraud.', margin: [0, 2] },
                        { text: '2.12. Event Manager bersedia menjadikan grup aplikasi "whatsapp" sebagai alat bukti yang sah jika terjadi penggelapan uang penjualan atau pelanggaran hukum lainnya.', margin: [0, 2] },
                        { text: '2.13. Pembatalan Event baik disebabkan oleh force majeure dan/atau permasalahan internal dari Event manager harus memberikan konfirmasi dan pemberitahuan kepada Heroestix Indonesia dan bersedia untuk membuat konferensi pers atau pengumuman baik melalui media online maupun cetak yang menyatakan bahwa Heroestix Indonesia tidak terlibat dalam proses Refund dan melapaskan segala tuntutan yang ditujukan pada Heroestix Indonesia.', margin: [0, 2] }
                    ],
                    style: 'list',
                    margin: [20, 10, 0, 20],
                    pageBreak: 'after'
                },

                // Pasal 3
                { text: 'Pasal 3: Hak Dan Kewajiban Platform Provider', style: 'pasalTitle' },
                {
                    stack: [
                        { text: '3.1. Hak Platform Provider, selain hak-hak yang telah dinyatakan dalam pasal-pasal lain Perjanjian ini adalah:', margin: [0, 2] },
                        {
                            stack: [
                                { text: '3.1.1. Menerima pembayaran Biaya Transaksi untuk setiap Transaksi yang berhasil atau sesuai dengan perjanjian awal yang telah disepakati bersama, yaitu: Rp0,-', margin: [0, 2] },
                                { text: '3.1.2. Menerima biaya penggunaan sistem/system fee per event sebesar biaya kesepakatan dengan skema pembayaran:', margin: [0, 2] },
                                { ul: ['a. Termin 1 (DP)', 'b. Termin 2 (Pelunasan)', 'Atau', 'c. Langsung Lunas'], margin: [40, 2] },
                                { text: '3.1.3. Membatasi, memblokir, memperlambat, menghapus dan/atau mengakhiri layanan Sistem Internet dan mengambil langkah-langkah hukum yang diperlukan apabila (Event Manager) dinilai telah melakukan pelanggaran baik berdasarkan perjanjian ini maupun hukum lainnya yang berlaku.', margin: [0, 2] },
                                { text: '3.1.4. [Hanya berlaku jika melakukan pemesanan (merchandise) atau (bahan cetak) di Heroestix Indonesia] Berhak untuk menagih pembayaran sebagian atau pelunasan perihal pemesanan (merchandise) dan/atau (bahan cetak) pada saat proses produksi akan dilakukan:', margin: [0, 2] },
                                {
                                    ul: [
                                        'a. Proses pembuatan akan dilakukan ketika sudah ada kesepakatan jumlah dan jenis (merchandise) atau (bahan cetak) yang dipesan disertai pelunasan pembayaran biaya pembuatan (merchandise) sebelum masuk produksi.',
                                        'b. Proses permintaan (bahan cetak) baik dilengkapi dengan QR maupun tidak, maksimal pemesanan adalah H-14 sebelum (merchandise) atau (bahan cetak) digunakan, jika terjadi keterlambatan pembuatan atau pengiriman yang disebabkan waktu pemesanan melebihi ketentuan, maka bukan tanggung jawab Heroestix Indonesia.',
                                        'c. Proses permintaan (bahan cetak) baik dilengkapi dengan QR maupun tidak, maksimal pemesanan adalah H-7 acara, jika terjadi keterlambatan pembuatan atau pengiriman yang disebabkan waktu pemesanan melebihi ketentuan, maka bukan tanggung jawab Heroestix Indonesia.'
                                    ],
                                    margin: [40, 2]
                                },
                                { text: '3.1.5. [Hanya berlaku untuk (event) yang berada di luar Daerah Istimewa Yogyakarta dan membutuhkan pendampingan secara langsung dari Heroestix Indonesia] (Man Power) yang berangkat ke luar dari Daerah Istimewa Yogyakarta, dalam hal ini untuk pendampingan (event) sesuai yang telah disepakati antara Heroestix Indonesia dan (event manager), berhak untuk mendapatkan:', margin: [0, 2] },
                                {
                                    ol: [
                                        '1. Fasilitas tiket pulang pergi (bisa menggunakan kereta minimal kelas eksekutif atau transportasi lain sesuai kesepakatan bersama) dari Yogyakarta ke kota penyelenggaraan (event) dan sebaliknya. Untuk tiket pulang pergi harus sudah disediakan maksimal H-2 keberangkatan.',
                                        '2. Biaya operasional untuk (man power) Heroestix Indonesia Rp. 500.000/per hari untuk satu orang, terhitung dari keberangkatan ke kota penyelenggara (event) sampai kembali ke Daerah Istimewa Yogyakarta.',
                                        '3. Fasilitas hotel/penginapan yang layak selama (event) berlangsung, terhitug dari berangkat ke kota penyelenggara (event) sampai kembali ke Daerah Istimewa Yogyakarta. Untuk hotel syaratnya tidak sharing dengan tim yang lain.',
                                        '4. Fasilitas transportasi pendukung dari hotel/penginapan ke lokasi venue (event) yang berlangsung, terhitung dari berangkat ke kota penyelenggara event sampai kembali ke Daerah Istimewa Yogyakarta.'
                                    ],
                                    margin: [40, 2]
                                },
                                { text: 'Untuk semua hak yang yang akan didapatkan oleh (Man Power), harus sudah disediakan dan dibayarkan sebelum keberangkatan Man Power ke kota penyelenggaraan (event). Atau (event manager) dapat membayarkan semua hak (Man Power) setelah penyelenggaraan event selesai dilakukan, namun harus atas dasar kesepakatan antara Heroestix Indonesia dan Event Manager', style: 'italicText', margin: [40, 2] },
                                { text: '3.1.6. Berhak untuk menegur dan/atau menuntut (event manager) jika tidak memenuhi kesepakatan yang telah dibuat sebagai bagian dari perjanjian Kerjasama atau dapat disebut kontraprestasi, yang mana adalah sebagai berikut:', margin: [0, 2] },
                                {
                                    ul: [
                                        'a. Penyertaan logo heroestix pada poster, backdrop, dan media sosial sebagai ticketing partner.',
                                        'b. Penayangan logo pada layar proyektor atau running picture, satu slide khusus untuk ticketing partner, logo Heroestix berada paling atas dengan proporsi paling besar dan tidak ada logo lain di bagian kanan atau kirinya. Logo official partner (apabila menggunakan official partner) berada di bawah logo heroestix (optional).',
                                        'c. Penyampaian atau adlips oleh MC.',
                                        'd. Penyertaan pada aftermovie.',
                                        'e. Wajib menyertakan link tiket pada bio instagram.',
                                        'f. Wajib tag official account instagram Heroestix Indonesia ketika post story dan feed.',
                                        'g. Bersedia menyediakan konsumsi bagi team Heroestix Indonesia yang bertugas di lapangan, untuk jumlah tim Heroestix Indonesia yang bertugas akan dikonfirmasi ulang sebelum hari H acara.',
                                        'h. Memberikan fasilitas all access bagi tim media Heroestix Indonesia untuk pengambilan dokumentasi acara, untuk jumlah tim Heroestix Indonesia yang bertugas akan dikonfirmasi ulang sebelum hari H acara.',
                                        'i. Wajib mencantumkan logo official partner, tag, dan sertakan pada caption disetiap media publikasi yang telah disepakati.'
                                    ],
                                    margin: [40, 2]
                                }
                            ],
                            margin: [20, 0, 0, 0]
                        },
                        { text: '3.2. Kewajiban Platform Provider, selain kewajiban-kewajiban yang telah dinyatakan dalam pasal-pasal lain Perjanjian ini adalah:', margin: [0, 5] },
                        {
                            ul: [
                                '3.2.1. Mengelola dan merawat Sistem Internet agar tetap lancar dan kooperasional.',
                                '3.2.2. Menyediakan custom landing page untuk penjualan tiket bagi (event manager). Ini merupakan (fitur khusus), hanya dibuat jika ada permintaan dari event manager. (biaya custom landing page diluar system fee).',
                                '3.2.3. Menyediakan website untuk (listing) event.',
                                '3.2.4. Menyediakan permintaan custom domain bagi event manager. Ini merupakan (fitur khusus), hanya dibuat jika ada permintaan dari (event manager). Biaya custom domain diluar system fee.',
                                '3.2.5. Menyediakan rekonsiliasi data Transaksi Internet untuk Event Manager.',
                                '3.2.6. Memberikan informasi kepada Event Manager terkait status Transaksi Internet.',
                                '3.2.7. Memberikan dukungan teknis atau operasional kepada Event Manager apabila diperlukan.',
                                '3.2.8. Menyiapkan system yang dibutuhkan oleh Event Manager sesuai dengan kesepakatan.',
                                '3.2.9. Bertanggung jawab atas masalah yang timbul atau hilangnya data yang dikarenakan oleh kegagalan system.'
                            ],
                            margin: [40, 2]
                        }
                    ],
                    style: 'list',
                    margin: [20, 10, 0, 20]
                },

                // Pasal 4
                { text: 'Pasal 4: Hak dan Kewajiban Event Manager', style: 'pasalTitle' },
                {
                    stack: [
                        { text: '4.1. Hak Event Manager, selain hak-hak yang telah dinyatakan dalam pasal-pasal lain Perjanjian ini adalah:', margin: [0, 2] },
                        {
                            ul: [
                                '4.1.1. Mendapatkan dukungan teknis maupun operasional dari Platform Provider.',
                                '4.1.2. Mendapatkan akun yang digunakan sebagai identitas Event Manager.',
                                '4.1.3. Menerima informasi status Transaksi Internet.',
                                '4.1.4. (Listing) acara pada situs resmi Heroestix Indonesia.',
                                '4.1.5. Mendapatkan website untuk event online jika terjadi kesepakatan untuk pembuatan custom website (fitur khusus).',
                                '4.1.6. Menerima pendapatan penjualan tiket melalui website Heroestix Indonesia.',
                                '4.1.7. Menerima edukasi atau demo terkait penggunaan layanan dan pengoperasian Sistem Administrasi dan Sistem Pembayaran Internet.',
                                '4.1.8. Mendapatkan fasilitas penjualan pada Official Partner yang tersedia tanpa potongan atau komisi prosentase penjualan tiket.'
                            ],
                            margin: [40, 2]
                        },
                        { text: '4.2. Kewajiban Event Manager, selain kewajiban-kewajiban yang telah dinyatakan dalam pasal-pasal lain Perjanjian ini adalah:', margin: [0, 5] },
                        {
                            ul: [
                                '4.2.1. Memberikan deskripsi acara, banner, serta informasi lainnya secara benar and sesuai dengan keadaan yang sesungguhnya serta sesuai dengan ketentuan parameter input pada sistem admin.',
                                '4.2.2. Menjaga akun yang diberikan oleh (Platform Manager) untuk tidak digunakan sembarangan.',
                                '4.2.3. Memenuhi kesepakatan atau kontraprestasi yang telah disepakati bersama.',
                                '4.2.4. Wajib melaporkan kepada Platform Manager jika terjadi penyelewengan data.',
                                '4.2.5. Mematuhi ketentuan dan persyaratan dari masing-masing Layanan Pembayaran yang telah ditetapkan oleh Bank dan Service Provider.',
                                '4.2.6. Event Manager DILARANG KERAS menyalahgunakan data pembeli yang terdaftar di sistem. Jika terjadi penyalahgunaan, maka Platform Provider akan menempuh jalur hukum dan (Event Manager) bersedia untuk dilaporkan atas tuduhan pelanggaran privasi.'
                            ],
                            margin: [40, 2]
                        }
                    ],
                    style: 'list',
                    margin: [20, 10, 0, 20],
                    pageBreak: 'after'
                },

                // Pasal 5
                { text: 'Pasal 5: Prosedur Operasi Standar (SOP)', style: 'pasalTitle' },
                {
                    stack: [
                        { text: '5.1. Laporan Rekapitulasi Transaksi Internet', margin: [0, 5] },
                        {
                            ul: [
                                '5.1.1. (Event Manager) berhak untuk melaporkan pihak (Platform Provider) jika terjadi pelanggaran yang dilakukan oleh pihak tersebut.',
                                '5.1.2. (Event Manager) dapat mengakses laporan dan status Transaksi Internet melalui sistem admin Heroestix Indonesia.',
                                '5.1.3. (Event Manager) dapat mendapatkan laporan rekapitulasi transaksi harian dalam format excel yang dapat diunduh sesuai dengan kebutuhan (Event Manager).',
                                '5.1.4. (Event Manager) dapat mengambil hasil penjualan tiket di (Official Partner) dengan menggunakan kode verifikasi yang telah tersedia di akun admin dan mengisi keterangan tambahan.',
                                '5.1.5. (Event Manager) tidak dapat melakukan penarikan habis pada hasil penjualan secara online apabila belum melunasi biaya sistem sesuai dengan kesepakatan pada Pasal 3 butir 3.1.2.',
                                '5.1.6. Batas pengambilan hasil penjualan di (Official Partner) adalah H+7, jika lebih dari itu maka uang penjualan menjadi HAK Heroestix Indonesia and tidak dapat dicairkan atau diminta oleh (Event Manager).',
                                '5.1.7. (Platform Manager) tidak menyediakan jaringan internet. Apabila terjadi kegagalan transaksi akibat dari koneksi yang dimiliki oleh (Event Manager), bukan tanggung jawab (Platform Manager).',
                                '5.1.8. (Platform Provider) bersedia untuk membantu kegagalan transaksi yang diakibatkan oleh pihak (Event Manager) dengan catatan transaksi atau data tidak hilang secara permanen, and bila tidak dapat dipulihkan, (Platform Provider) tidak bertanggung jawab atas kejadian tersebut.',
                                '5.1.9. Refund yang dilakukan oleh (Platform Manager) jika terjadi kegagalan pada sistem bayar dari bank, bukan karena pembatalan tiket yang dilakukan oleh pemilik tiket.',
                                '5.1.10. Jika pemilik tiket akan memberikan atau menjual tiket yang dimilikinya, maka harus memberitahukan kepada (Event Manager) terlebih dahulu agar dapat dilakukan perubahan data atau informasi pemegang tiket. Jika terdapat kendala dalam perubahan informasi pemilik tiket, (Platform Provider) akan membantu proses pembetulan data tersebut.',
                                '5.1.11. Jika terjadi kegagalan transaksi pada Virtual Account Bank tertentu, akan dikerjakan maksimal 3 hari kerja setelah adanya laporan kepada pihak (Platform Provider) and akan diberikan penjelasan terkait dari kegagalan tersebut langsung dari pihak bank atau Payment Gateway.',
                                '5.1.12. (Event Manager) dapat mengajukan permohonan penarikan/pengambilan dana transaksi yang dilakukan melalui store Heroestix Indonesia atau situs resmi Heroestix Indonesia kapanpun tanpa minimal transaksi.',
                                '5.1.13. Penarikan dana atau hasil penjualan dilayani saat jam kerja operasional bank, dana akan dipindahkan oleh Heroestix Indonesia ke nomer rekening yang telah disepakati and ditulis pada template penarikan pada grup whatsapp.',
                                '5.1.14. Jika waktu penarikan dilakukan pada bukan hari kerja, maka Heroestix Indonesia berhak untuk melakukan proses tersebut pada hari selanjutnya atau pada hari kerja.',
                                '5.1.15. Batas maksimal pengambilan/penarikan dana adalah H+6 acara, jika melebihi dari hari tersebut, maka dana tersebut menjadi hak milik Heroestix.',
                                '5.1.16. (Platform Manager) berhak menahan pencairan dana kepada (Event Manager) dalam hal terdapat kecurigaan dari Platform Provider/Bank/Principal atas adanya penipuan (fraud) yang dilakukan oleh (Event Manager). Dalam hal terdapat kecurigaan tersebut, maka (Event Manager) wajib untuk memberikan dokumen-dokumen yang dapat membuktikan bahwa (Event Manager) tidak melakukan penipuan (fraud). Dalam hal (Event Manager) tidak berhasil memberikan bukti, maka Platform Provider berhak untuk melakukan Refund atas seluruh Transaksi Internet yang telah dilakukan and (Platform Manager) dapat melakukan tindakan hukum apapun termasuk pengakhiran Perjanjian.',
                                '5.1.17. Jika terjadi pembatalan (event), maka segala uang tiket yang sudah ditransfer menjadi tanggung jawab (event manager) and uang yang belum di withdraw akan dibekukan sementara sampai ada kejelasan and penyelesaian masalah. Dan jika ada mekanisme refund ke pembeli, maka proses ini merupakan tanggung jawab and tugas (event manager).'
                            ],
                            margin: [40, 2]
                        },
                        { text: '5.2. Ketentuan Refund and sanksi pembatalan.', margin: [0, 5] },
                        {
                            ul: [
                                '5.2.1. Platform Provider hanya melakukan Refund jika terjadi kegagalan pembayaran yang dikarenakan oleh sistem.',
                                '5.2.2. Jika customer memaksa ingin melakukan Refund, maka segala keputusan refund adalah wewenang (Event Manager). Proses tersebut akan dilakukan sendiri oleh (Event Manager).',
                                '5.2.3. Jika terjadi pembatalan penggunaan sistem setelah terjadi kesepakatan secara verbal maupun non verbal atau sudah membayarkan biaya sewa sistem atau permintaan fitur yang telah dibuat and/atau sudah melakukan penandatanganan MoU, maka (Event Manager) tetap harus membayarkan uang biaya sewa sesuai kesepakatan.',
                                '5.2.4. Jika (Event Manager) tidak membayarkan biaya sewa sistem saat melakukan pembatalan and/atau biaya lainnya yang sudah disepakati, maka (Event Manager) bersedia untuk dilaporkan kepada pihak berwajib dengan tuntutan penipuan and penggelapan dana.'
                            ],
                            margin: [40, 2]
                        }
                    ],
                    style: 'list',
                    margin: [20, 10, 0, 20]
                },

                // Pasal 6
                { text: 'Pasal 6: Penghentian Sementara Layanan Sistem Pembayaran Internet', style: 'pasalTitle' },
                {
                    stack: [
                        { text: '6.1. Platform Provider dapat setiap saat menghentikan/mematikan Sistem Internet untuk sementara waktu dengan pemberitahuan selambat-lambatnya 2 (dua) Hari Kerja sebelumnya kepada (Event Manager).', margin: [0, 2] },
                        { text: '6.2. Penghentian layanan Sistem Pembayaran Internet dapat disebabkan oleh alasan-alasan sebagai berikut:', margin: [0, 2] },
                        {
                            ul: [
                                '6.2.1. Inspeksi, perbaikan, pemeliharaan atau peningkatan sistem.',
                                '6.2.2. Adanya alasan tertentu berupa melindungi hak-hak and/atau kepentingan Para Pihak; atau alasan jelas lain yang ditentukan oleh Platform Provider, Bank, atau Customer.'
                            ],
                            margin: [40, 2]
                        }
                    ],
                    style: 'list',
                    margin: [20, 10, 0, 20]
                },

                // Pasal 7
                { text: 'Pasal 7: Domisili Hukum dan Penyelesaian Sengketa', style: 'pasalTitle' },
                {
                    stack: [
                        { text: '7.1. Perjanjian ini diatur and tunduk pada hukum yang berlaku di Negara Republik Indonesia.', margin: [0, 2] },
                        { text: '7.2. Apabila dalam pelaksanaan Perjanjian ini terjadi perbedaan pendapat and/atau penafsiran maupun terjadi perselisihan diantara Para Pihak dalam Perjanjian ini, maka Para Pihak sepakat untuk menyelesaikannya secara musyawarah dengan itikad baik untuk mencapai mufakat. Apabila musyawarah mufakat tidak tercapai, maka Para Pihak sepakat memilih kedudukan hukum yang tetap and seumumnya di Kantor Kepaniteraan Pengadilan Negeri Kota Yogyakarta sebagai sarana penyelesaian perselisihan tersebut.', margin: [0, 2] }
                    ],
                    style: 'list',
                    margin: [20, 10, 0, 20]
                },

                // Pasal 8
                { text: 'Pasal 8: Ketentuan Lainnya', style: 'pasalTitle' },
                {
                    stack: [
                        { text: '8.1. Lampiran. Segala Lampiran, Addendum, Surat Komunikasi, serta dokumen-dokumen lainnya yang dibuat berdasarkan atau sehubungan dengan Perjanjian ini, merupakan bagian integral dari and menjadi lampiran yang tidak terpisahkan dari Perjanjian ini.', margin: [0, 2] },
                        { text: '8.2. Perubahan. Perjanjian ini tidak boleh diubah atau ditambah kecuali disetujui oleh Para Pihak and termaktub dalam perjanjian formal yang ditandatangani oleh Para Pihak.', margin: [0, 2] },
                        { text: '8.3. Addendum. Hal-hal yang tidak atau belum diatur dalam atau perubahan atas Perjanjian ini, akan diatur kemudian melalui addendum yang disepakati and ditandatangani oleh Para Pihak; addendum mana menjadi bagian integral and menjadi lampiran yang tidak terpisahkan dari Perjanjian ini.', margin: [0, 2] },
                        { text: '8.4. Pelepasan Hak. Dalam hal terjadi kegagalan, penundaan atau keterlambatan oleh salah satu Pihak dalam melaksanakan haknya atau menuntut pemenuhan kewajiban dari Pihak lainnya berdasarkan Perjanjian ini, maka kegagalan, penundaan atau keterlambatan tersebut bukan merupakan pelepasan hak oleh pihak tersebut untuk dikemudian hari melaksanakan haknya atau menuntut pemenuhan kewajiban pihak lainnya berdasarkan Perjanjian ini.', margin: [0, 2] },
                        { text: '8.5. Tidak Ada Pengalihan. Perjanjian ini mengikat and dibuat untuk kepentingan dari setiap Pihak and penerima and/atau pengganti haknya masing-masing, akan tetapi dengan ketentuan, bahwa tidak ada Pihak yang boleh mengalihkan setiap hak-hak yang timbul dari atau berkenaan dengan Perjanjian ini kepada pihak ketiga manapun, tanpa persetujuan tertulis terlebih dahulu dari Pihak lainnya.', margin: [0, 2] }
                    ],
                    style: 'list',
                    margin: [20, 10, 0, 40],
                    pageBreak: 'after'
                },

                // Signature Section
                {
                    text: 'PERSETUJUAN EVENT MANAGER',
                    style: 'tcTitle',
                    alignment: 'center',
                    margin: [0, 20, 0, 20]
                },
                {
                    ul: [
                        'Saya/kami dengan ini menyatakan bahwa keterangan ini dibuat dengan sebenarnya untuk mengajukan permohonan sebagai client Heroestix Indonesia. Sebagai client Heroestix Indonesia, saya/kami akan bertanggung jawab sepenuhnya atas perjanjian yang sudah dibuat serta peraturan yang berlaku.',
                        'Saya/kami menyetujui seluruh pasal and butir yang ada dalam perjanjian ini walaupun tanpa adanya paraf pada masing-masing halaman jika proses penandatanganan menggunakan (sarana digital).'
                    ],
                    margin: [0, 0, 0, 60]
                },

                {
                    columns: [
                        {
                            width: '50%',
                            stack: [
                                { text: 'Platform Provider', style: 'signatureLabel' },
                                { text: 'Heroestix Indonesia', style: 'signatureCompany' },
                                { text: '', margin: [0, 30] },
                                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1, lineColor: 'black' }], margin: [0, 10] },
                                { text: 'Brian Ellia Aryanto / Bima Dwi Kurnianto', style: 'signatureName' },
                                { text: 'CEO / BOD', style: 'signaturePos' }
                            ],
                            alignment: 'center'
                        },
                        {
                            width: '50%',
                            stack: [
                                { text: 'Event Manager', style: 'signatureLabel' },
                                { text: data?.brand_name || 'Diisi Dari Pemberkasan', style: 'signatureCompany' },
                                { text: '', margin: [0, 30] },
                                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1, lineColor: 'black' }], margin: [0, 10] },
                                { text: data?.director_name || 'Diisi Dari Pemberkasan', style: 'signatureName' },
                                { text: 'Principle / Ketua Event', style: 'signaturePos' }
                            ],
                            alignment: 'center'
                        }
                    ]
                },

                { text: '', pageBreak: 'before' },

                // Lampiran Table Section (User Request - Matching Screenshot)
                {
                    text: 'LAMPIRAN',
                    style: 'tcTitle',
                    alignment: 'center',
                    margin: [0, 0, 0, 20]
                },
                {
                    table: {
                        widths: ['*', '*'],
                        body: [
                            [
                                { text: 'Nama Dokumen', style: 'tableLabel' },
                                { text: '', style: 'tableLabel' }
                            ],
                            // Akta & NIB usually just "Terlampir" text or status
                            [
                                { text: 'Akta Perusahaan', margin: [0, 10] },
                                { text: data?.akte_notaris_url ? 'Terlampir' : 'Dokumen Belum di upload', margin: [0, 10], alignment: 'center' }
                            ],
                            [
                                { text: 'NIB', margin: [0, 10] },
                                { text: data?.nib_url ? 'Terlampir' : 'Dokumen Belum di upload', margin: [0, 10], alignment: 'center' }
                            ],
                            // NPWP
                            [
                                { text: 'NPWP', margin: [0, 10] },
                                attachments.npwp_pic_url || attachments.npwp_company_url
                                    ? { image: attachments.npwp_pic_url || attachments.npwp_company_url, width: 200, margin: [0, 10], alignment: 'center' }
                                    : { text: 'Dokumen Belum di upload', margin: [0, 10], alignment: 'center' }
                            ],
                            // KTP
                            [
                                { text: 'KTP Direktur', margin: [0, 10] },
                                attachments.ktp_pic_url 
                                    ? { image: attachments.ktp_pic_url, width: 200, margin: [0, 10], alignment: 'center' }
                                    : { text: 'Dokumen Belum di upload', margin: [0, 10], alignment: 'center' }
                            ],
                            // Bank Book
                            [
                                { text: 'Foto Buku Rekening Perusahaan', margin: [0, 10] },
                                attachments.bank_book_pic_url
                                    ? { image: attachments.bank_book_pic_url, width: 200, margin: [0, 10], alignment: 'center' }
                                    : { text: 'Dokumen Belum di upload', margin: [0, 10], alignment: 'center' }
                            ]
                        ]
                    },
                    layout: {
                        paddingLeft: () => 10,
                        paddingRight: () => 10,
                        paddingTop: () => 5,
                        paddingBottom: () => 5,
                        hLineWidth: (i) => i === 0 || i === 1 ? 1 : 1,
                        vLineWidth: (i) => i === 0 || i === 1 || i === 2 ? 1 : 1
                    }
                }
            ],
            styles: {
                headerMain: { fontSize: 14, bold: true, alignment: 'center', margin: [0, 10, 0, 0] },
                headerSub: { fontSize: 12, bold: true, italics: true, alignment: 'center' },
                headerNumber: { fontSize: 11, alignment: 'center', margin: [0, 5, 0, 20] },
                sectionTitle: { fontSize: 12, bold: true, margin: [0, 15, 0, 10] },
                bodyText: { fontSize: 11, alignment: 'justify', margin: [0, 5, 0, 5] },
                signatureLabel: { fontSize: 11, bold: true },
                appendixHeader: { fontSize: 14, bold: true, alignment: 'center', margin: [0, 20, 0, 20], decoration: 'underline' },
                header: { fontSize: 14, bold: true },
                subHeader: { fontSize: 10, bold: true },
                infoTitle: { fontSize: 11, bold: true },
                infoText: { fontSize: 10 },
                label: { fontSize: 9, bold: true, transform: 'uppercase' },
                value: { fontSize: 11, bold: true },
                tableLabel: { fontSize: 9, bold: true, alignment: 'center' },
                tableValue: { fontSize: 10, bold: true, alignment: 'center' },
                paragraph: { fontSize: 10, alignment: 'justify' },
                tcTitle: { fontSize: 12, bold: true },
                pasalTitle: { fontSize: 11, bold: true, margin: [0, 10, 0, 5] },
                list: { fontSize: 9, alignment: 'justify' },
                signatureLabel: { fontSize: 9, bold: true },
                signatureCompany: { fontSize: 11, bold: true },
                signatureName: { fontSize: 10, bold: true },
                signaturePos: { fontSize: 9, bold: true },
                listText: { fontSize: 9, margin: [0, 2], bold: true },
                italicText: { fontSize: 9, italic: true }
            }
        };

        // Create the PDF
        pdfMake.createPdf(docDefinition).download(`MOU-Heroestix-${data?.brand_name?.replace(/\s+/g, '-') || 'Draft'}.pdf`);

        return true;
    } catch (error) {
        console.error('PDF Generation Error:', error);
        throw error;
    }
};
