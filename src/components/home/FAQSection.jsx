import React, { useState } from "react";
import { FiChevronDown, FiPlus, FiMinus } from "react-icons/fi";

const FAQItem = ({ question, answer, isOpen, onClick }) => {
    return (
        <div className="border-b border-gray-200 last:border-0">
            <button
                className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
                onClick={onClick}
            >
                <span className={`text-lg font-semibold transition-colors duration-200 ${isOpen ? "text-[#b1451a]" : "text-gray-900 group-hover:text-[#b1451a]"}`}>
                    {question}
                </span>
                <div className={`p-2 rounded-full transition-all duration-300 ${isOpen ? "bg-[#b1451a] text-white rotate-180" : "bg-gray-100 text-gray-500"}`}>
                    <FiChevronDown size={20} />
                </div>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <p className="text-gray-600 leading-relaxed">
                    {answer}
                </p>
            </div>
        </div>
    );
};

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState(0);

    const faqs = [
        {
            question: "Bagaimana cara membeli tiket?",
            answer: "Cukup pilih event favoritmu, klik tombol 'Beli', masukkan jumlah tiket dan data diri, lalu selesaikan pembayaran. E-tiket akan dikirimkan ke email atau dapat diakses di menu profil."
        },
        {
            question: "Metode pembayaran apa saja yang tersedia?",
            answer: "Kami mendukung berbagai metode pembayaran mulai dari Virtual Account (Mandiri, BCA, BNI), E-wallet (OVO, Dana, ShopeePay), hingga Kartu Kredit."
        },
        {
            question: "Apakah saya bisa melakukan refund tiket?",
            answer: "Kebijakan refund bergantung pada masing-masing penyelenggara event (EO). Kamu bisa mengecek detail kebijakan pengembalian di halaman detail masing-masing event."
        },
        {
            question: "Bagaimana cara menukarkan tiket di lokasi?",
            answer: "Cukup tunjukkan barcode/QR code e-tiket yang ada di aplikasi atau email ke petugas di pintu masuk event untuk dipindai."
        },
        {
            question: "Apakah aman membeli tiket di Heroestix?",
            answer: "Sangat aman. Heroestix menggunakan sistem enkripsi data dan payment gateway resmi yang terjamin keamanannya untuk setiap transaksi."
        }
    ];

    return (
        <section id="faq" className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h4 className="text-[#b1451a] font-bold tracking-wider uppercase text-sm mb-3">FAQ</h4>
                    <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
                        Pertanyaan Umum
                    </h2>
                    <p className="text-gray-500 max-w-lg mx-auto">
                        Temukan jawaban cepat seputar pembelian tiket, pembayaran, dan informasi lainnya.
                    </p>
                </div>

                <div className="space-y-2">
                    {faqs.map((faq, index) => (
                        <FAQItem
                            key={index}
                            question={faq.question}
                            answer={faq.answer}
                            isOpen={openIndex === index}
                            onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
