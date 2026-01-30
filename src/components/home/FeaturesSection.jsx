import React from "react";
import {
    Layout,
    ShieldCheck,
    BarChart3,
    Ticket,
    CreditCard
} from "lucide-react";

const features = [
    {
        icon: <Layout size={32} className="text-blue-500" />,
        title: "Kelola Event Terpadu",
        desc: "Monitor pendaftaran hingga check-in peserta dalam satu dashboard intuitif.",
        bgColor: "bg-blue-50/50",
        borderColor: "border-blue-100"
    },
    {
        icon: <BarChart3 size={32} className="text-emerald-500" />,
        title: "Analitik Akurat",
        desc: "Pantau statistik penjualan dan demografi peserta secara real-time.",
        bgColor: "bg-emerald-50/50",
        borderColor: "border-emerald-100"
    },
    {
        icon: <ShieldCheck size={32} className="text-amber-500" />,
        title: "Keamanan Transaksi",
        desc: "Sistem enkripsi mutakhir menjamin data dan dana transaksi tetap aman.",
        bgColor: "bg-amber-50/50",
        borderColor: "border-amber-100"
    },
    {
        icon: <CreditCard size={32} className="text-rose-500" />,
        title: "Metode Pembayaran Luas",
        desc: "Terintegrasi dengan berbagai bank dan e-wallet untuk kemudahan peserta.",
        bgColor: "bg-rose-50/50",
        borderColor: "border-rose-100"
    }
];

export default function FeaturesSection() {
    return (
        <section id="features" className="py-24 bg-white">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                        Kenapa Harus <span className="text-blue-600">Heroestix</span>?
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        Kami menyediakan solusi end-to-end untuk manajemen event Anda,
                        memastikan setiap langkah berjalan lancar dan profesional.
                    </p>
                    <div className="h-1.5 w-20 bg-blue-600 mx-auto mt-8 rounded-full" />
                </div>

                {/* Features Grid */}
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`group p-8 rounded-[2rem] border ${feature.borderColor} ${feature.bgColor} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col items-center text-center`}
                        >
                            {/* Icon Wrapper */}
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                {feature.icon}
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-slate-900 mb-4">
                                {feature.title}
                            </h3>

                            {/* Description */}
                            <p className="text-slate-600 leading-relaxed">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
