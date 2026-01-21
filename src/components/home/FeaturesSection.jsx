import React from "react";
import { FiShield, FiTrendingUp, FiSettings, FiPhoneCall, FiUserCheck } from "react-icons/fi";

const features = [
    {
        icon: <FiSettings size={32} />,
        title: "Sistem Terintegrasi",
        desc: "Kelola pendaftaran, penjualan, hingga check-in peserta dalam satu platform yang canggih."
    },
    {
        icon: <FiShield size={32} />,
        title: "Keamanan Transaksi",
        desc: "Setiap transaksi dilindungi oleh sistem enkripsi terbaru untuk menjamin keamanan dana & data."
    },
    {
        icon: <FiTrendingUp size={32} />,
        title: "Laporan Real-time",
        desc: "Pantau statistik penjualan dan demografi peserta secara langsung melalui dashboard analitik."
    },
    {
        icon: <FiPhoneCall size={32} />,
        title: "Dukungan 24/7",
        desc: "Tim teknis kami selalu siap siaga membantu kelancaran event Anda kapanpun dibutuhkan."
    },
    {
        icon: <FiUserCheck size={32} />,
        title: "User Friendly",
        desc: "Proses pembelian tiket yang simpel dan cepat memberikan pengalaman terbaik bagi peserta."
    }
];

export default function FeaturesSection() {
    return (
        <section className="bg-[#5d3a24] py-32 px-4 sm:px-6 lg:px-12 relative overflow-hidden">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#b1451a]/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#f59e0b]/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-24 space-y-4">
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
                        MENGAPA <span className="text-[#b1451a]">HEROESTIX?</span>
                    </h2>
                    <p className="text-orange-200/50 font-medium max-w-2xl mx-auto">
                        Solusi ticketing modern dengan fitur unggulan untuk membantu mensukseskan berbagai jenis event Anda.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {features.map((item, idx) => (
                        <div
                            key={idx}
                            className="group relative bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-3 flex flex-col items-center text-center overflow-hidden"
                        >
                            {/* Accent Background on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-b from-[#b1451a]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            <div className="relative z-10 space-y-8 flex flex-col items-center">
                                <div className="w-16 h-16 bg-[#b1451a] text-white flex items-center justify-center rounded-2xl shadow-[0_10px_30px_rgba(177,69,26,0.3)] group-hover:scale-110 group-hover:shadow-[0_20px_40px_rgba(177,69,26,0.5)] transition-all duration-500">
                                    {item.icon}
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-orange-100/40 leading-relaxed font-medium group-hover:text-orange-100/60 transition-colors">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>

                            {/* Decorative Line */}
                            <div className="mt-8 h-1 w-8 bg-[#b1451a] rounded-full group-hover:w-full transition-all duration-700"></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
