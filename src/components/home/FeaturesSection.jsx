import React from "react";
import {
    Zap,
    ShieldCheck,
    CreditCard,
    BarChart3,
    QrCode,
    Headphones
} from "lucide-react";

const features = [
    {
        icon: <Zap size={24} className="text-white" />,
        title: "Pemesanan Kilat",
        desc: "Proses pembelian tiket yang super cepat dan mudah, tanpa antrian panjang.",
        bgColor: "bg-blue-500",
    },
    {
        icon: <ShieldCheck size={24} className="text-white" />,
        title: "Keamanan Terjamin",
        desc: "Data dan transaksi Anda dilindungi dengan sistem keamanan enkripsi terkini.",
        bgColor: "bg-cyan-500",
    },
    {
        icon: <CreditCard size={24} className="text-white" />,
        title: "Pembayaran Lengkap",
        desc: "Mendukung berbagai metode pembayaran, mulai dari QRIS hingga Virtual Account.",
        bgColor: "bg-orange-500",
    },
    {
        icon: <BarChart3 size={24} className="text-white" />,
        title: "Analitik Real-Time",
        desc: "Pantau performa penjualan tiket dan data pengunjung secara langsung.",
        bgColor: "bg-yellow-500",
    },
    {
        icon: <QrCode size={24} className="text-white" />,
        title: "Validasi Tiket Instan",
        desc: "Check-in peserta lebih cepat dengan sistem scan QR Code yang efisien.",
        bgColor: "bg-purple-500",
    },
    {
        icon: <Headphones size={24} className="text-white" />,
        title: "Layanan 24/7",
        desc: "Tim support kami siap membantu kendala teknis maupun non-teknis kapan saja.",
        bgColor: "bg-red-500",
    }
];

export default function FeaturesSection() {
    return (
        <section className="w-full py-16 px-4 md:px-12 bg-transparent">
            <div className="max-w-7xl mx-auto rounded-2xl bg-[#020617] border border-white/5 overflow-hidden flex flex-col md:flex-row shadow-2xl">
                {/* Left Side - Text Content */}
                <div className="w-full md:w-5/12 p-10 md:p-16 flex flex-col justify-center text-white relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-medium mb-6 leading-tight flex flex-wrap items-center gap-3">
                            Kenapa Harus
                            <span className="inline-flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <img
                                    src="/Logo/Hero.png"
                                    alt="Hero Icon"
                                    className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-lg"
                                />
                                <span className="text-white">Heroestix ?</span>
                            </span>
                        </h2>
                        <p className="text-slate-400 text-lg mb-10 leading-relaxed opacity-90">
                            Kami menyediakan solusi manajemen tiket event yang lengkap, aman, dan mudah digunakan untuk kesuksesan acara Anda.
                        </p>

                        <button className="px-8 py-3 border-2 border-white/10 rounded-2xl hover:bg-white hover:text-blue-900 transition-all duration-300 font-medium text-sm tracking-wide w-fit text-slate-300">
                            Pelajari Selengkapnya
                        </button>
                    </div>
                </div>

                {/* Right Side - Feature Grid */}
                <div className="w-full md:w-7/12 bg-white/[0.02] p-6 md:p-12 border-l border-white/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-sm hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 h-full flex flex-col group">
                                <div className={`w-12 h-12 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-5 shrink-0 shadow-lg shadow-blue-500/10 transition-transform duration-300 group-hover:scale-110`}>
                                    {feature.icon}
                                </div>
                                <h3 className="font-medium text-white text-lg mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
