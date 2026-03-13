import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";

export default function PaymentFailed() {
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-[#fbffff] min-h-screen font-sans text-slate-900 flex flex-col">
            <Navbar alwaysScrolled={true} />
            <div className="flex-grow flex items-center justify-center pt-32 pb-20 px-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[32px] p-8 text-center shadow-2xl border border-slate-100 dark:border-slate-800 transition-all">
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Pembayaran Gagal</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium leading-relaxed">
                        Maaf, pembayaran Anda untuk pesanan <span className="font-bold text-slate-700 dark:text-slate-300">#{id?.substring(0, 8).toUpperCase()}</span> gagal atau telah dibatalkan oleh sistem.
                    </p>
                    
                    <div className="space-y-4">
                        <button 
                            onClick={() => navigate(`/`)}
                            className="w-full bg-[#1b3bb6] hover:bg-blue-800 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98]"
                        >
                            Cari Tiket Lain
                        </button>
                        <button 
                            onClick={() => navigate(`/profile`)}
                            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-5 rounded-2xl transition-all active:scale-[0.98]"
                        >
                            Lihat Riwayat Transaksi
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

