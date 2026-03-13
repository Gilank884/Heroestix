import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function PaymentStatus() {
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // Fetch the order to get the status. We can also check transactions.
                // Best to check order status since it summarizes the state.
                const { data, error } = await supabase
                    .from("orders")
                    .select("status")
                    .eq("id", id)
                    .single();

                if (error || !data) {
                    navigate(`/payment/failed/${id}`, { replace: true });
                    return;
                }

                if (data.status === "paid" || data.status === "success") {
                    navigate(`/payment/success/${id}`, { replace: true });
                } else if (data.status === "failed" || data.status === "expired" || data.status === "canceled" || data.status === "cancelled") {
                    navigate(`/payment/failed/${id}`, { replace: true });
                } else {
                    // Pending or other
                    navigate(`/payment/pending/${id}`, { replace: true });
                }
            } catch (err) {
                console.error("Error checking payment status:", err);
                navigate(`/payment/pending/${id}`, { replace: true });
            }
        };

        checkStatus();
    }, [id, navigate]);

    return (
        <div className="bg-[#fbffff] dark:bg-slate-950 min-h-screen font-sans text-slate-900 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/50 animate-bounce">
                <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Memproses Pembayaran</h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Mohon tunggu sebentar...</p>
            
            <div className="mt-12 flex gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
            </div>
        </div>
    );
}

