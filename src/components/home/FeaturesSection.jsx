import React from "react";
import {
    Layout,
    ShieldCheck,
    BarChart3,
    Zap,
    CreditCard,
    Users
} from "lucide-react";

const features = [
    {
        icon: <Layout className="text-blue-600" size={32} />,
        title: "Kelola Event Terpadu",
        desc: "Monitor pendaftaran, penjualan, hingga check-in peserta dalam satu dashboard intuitif."
    },
    {
        icon: <Ticket className="text-blue-600" size={32} />,
        title: "Pilihan Tiket Fleksibel",
        desc: "Dukung berbagai jenis tiket mulai dari Early Bird hingga VVIP dengan kuota yang terjaga."
    },
    {
        icon: <BarChart3 className="text-blue-600" size={32} />,
        title: "Analitik Data Akurat",
        desc: "Pantau statistik penjualan dan demografi peserta secara real-time untuk strategi event Anda."
    },
    {
        icon: <ShieldCheck className="text-blue-600" size={32} />,
        title: "Keamanan Transaksi",
        desc: "Sistem enkripsi mutakhir menjamin data dan dana transaksi Anda selalu dalam keadaan aman."
    },
    {
        icon: <CreditCard className="text-blue-600" size={32} />,
        title: "Metode Pembayaran Luas",
        desc: "Terintegrasi dengan berbagai pilihan bank dan e-wallet untuk kemudahan peserta Anda."
    }
];

// Re-using Ticket icon from lucide because I forgot to import it in the array
import { Ticket } from "lucide-react";

export default function FeaturesSection() {
    return (
        <section className="bg-white py-24 px-4 sm:px-6 lg:px-12">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] tracking-tight">
                        Kenapa Harus Heroestix?
                    </h2>
                </div>

                {/* Features Grid - Top Row (3 items) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                    {features.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center group">
                            <div className="w-20 h-20 mb-6 bg-blue-50 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                                {item.icon}
                            </div>
                            <h3 className="text-lg font-bold text-[#111827] mb-2 leading-tight">
                                {item.title}
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-[250px]">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Features Grid - Bottom Row (2 items, centered) */}
                <div className="flex flex-col md:flex-row justify-center gap-12 md:gap-24">
                    {features.slice(3, 5).map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center group md:w-1/3">
                            <div className="w-20 h-20 mb-6 bg-blue-50 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                                {item.icon}
                            </div>
                            <h3 className="text-lg font-bold text-[#111827] mb-2 leading-tight">
                                {item.title}
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-[250px]">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
