import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import { supabase } from "../../lib/supabaseClient";

export default function PaymentSuccess() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [externalId, setExternalId] = useState("");

    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchTransactionId = async () => {
            try {
                const { data, error } = await supabase
                    .from("transactions")
                    .select("external_id")
                    .eq("order_id", id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (data?.external_id) {
                    setExternalId(data.external_id);
                }
            } catch (err) {
                console.error("Error fetching external_id:", err);
            }
        };

        if (id) fetchTransactionId();
    }, [id]);

    return (
        <div className="bg-[#fbffff] min-h-screen font-sans text-slate-900 flex flex-col">
            <Navbar alwaysScrolled={true} />
            <div className="flex-grow flex items-center justify-center pt-32 pb-20 px-4">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-slate-100">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">Pembayaran Berhasil!</h2>
                    <p className="text-slate-500 mb-8 font-medium">
                        Terima kasih, pembayaran untuk Transaksi <span className="font-bold text-slate-700">{externalId || id?.substring(0, 8).toUpperCase()}</span> telah kami terima. Tiket telah dikirimkan ke email Anda.
                    </p>

                    <button
                        onClick={() => navigate(`/transaction-detail/${id}`)}
                        className="w-full bg-[#1b3bb6] hover:bg-blue-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/30"
                    >
                        Lihat E-Tiket Saya
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full mt-4 bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-600 font-bold py-4 rounded-2xl transition-all"
                    >
                        Kembali ke Beranda
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
}
