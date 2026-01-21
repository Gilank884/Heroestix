import { motion } from 'framer-motion';


const clients = [
    { name: 'PT. Telkom Indonesia', desc: 'Enterprise - Tech Support' },
    { name: 'Digital Oasis', desc: 'Creative Agency support' },
    { name: 'Kementerian Keuangan', desc: 'Government Service' },
];

export default function ClientSection() {
    return (
        <section className="w-full py-12 px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-6xl mx-auto"
            >
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                    <div className="max-w-xl">
                        <span className="text-sm font-black text-[#b1451a] tracking-widest uppercase mb-3 block">Kepercayaan</span>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Telah Dipercaya Oleh <br /><span className="text-[#b1451a]">Event Organizer Ternama.</span></h2>
                    </div>
                    <p className="text-slate-500 font-medium max-w-sm">
                        Hai-Ticket telah membantu ribuan penyelenggara mulai dari konser musik, festival budaya, hingga seminar nasional dalam mengelola sistem tiket mereka.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {clients.map((c, idx) => (
                        <motion.div
                            key={c.name}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#b1451a]/20 transition-all duration-300 group"
                        >
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl mb-6 flex items-center justify-center group-hover:bg-[#b1451a]/10 transition-colors">
                                <span className="text-[#b1451a] font-black text-xl">{c.name.charAt(0)}</span>
                            </div>
                            <h3 className="font-black text-lg text-slate-800 mb-1">{c.name}</h3>
                            <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">{c.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}