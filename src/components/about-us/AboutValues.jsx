import React from "react";
import { motion } from "framer-motion";
import { HiLightningBolt, HiShieldCheck, HiVariable, HiUserGroup } from "react-icons/hi";

const AboutValues = () => {
    const values = [
        {
            icon: <HiLightningBolt />,
            title: "Kecepatan",
            desc: "Pemesanan tiket hingga masuk ke venue hanya dalam hitungan detik dengan sistem gate-entry yang canggih.",
            color: "bg-orange-50",
            iconColor: "text-[#b1451a]"
        },
        {
            icon: <HiShieldCheck />,
            title: "Keamanan",
            desc: "Sistem e-ticket yang terenkripsi dan anti-duplikat guna menjamin keaslian tiket setiap pengunjung.",
            color: "bg-slate-50",
            iconColor: "text-slate-700"
        },
        {
            icon: <HiVariable />,
            title: "Inovasi",
            desc: "Terus menghadirkan fitur baru seperti pemilihan seat map, kustomisasi kategori tiket, dan dashboard analitik event.",
            color: "bg-orange-100/30",
            iconColor: "text-[#d66a4a]"
        },
        {
            icon: <HiUserGroup />,
            title: "Komunitas",
            desc: "Membangun hubungan yang erat antara penyelenggara dan pengunjung untuk pengalaman yang lebih baik.",
            color: "bg-slate-900",
            iconColor: "text-white",
            textColor: "text-slate-300",
            headColor: "text-white"
        }
    ];

    return (
        <section className="py-32 bg-[#fdf5f2]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight"
                    >
                        Nilai-Nilai <span className="text-[#b1451a]">Utama Kami.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-500 mt-4 font-medium max-w-xl mx-auto"
                    >
                        Apa yang membuat Hai-Ticket berbeda? Dedikasi kami pada empat pilar inti yang mendasari setiap baris kode yang kami tulis.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {values.map((val, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ y: -10 }}
                            className={`${val.color} p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-white/50 group`}
                        >
                            <div className={`${val.iconColor} text-4xl mb-8 group-hover:scale-110 transition-transform duration-300`}>
                                {val.icon}
                            </div>
                            <h3 className={`text-xl font-black mb-4 ${val.headColor || "text-slate-800"}`}>{val.title}</h3>
                            <p className={`text-sm font-medium leading-relaxed ${val.textColor || "text-slate-500"}`}>
                                {val.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AboutValues;
