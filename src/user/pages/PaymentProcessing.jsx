import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import { supabase } from "../../lib/supabaseClient";

export default function PaymentProcessing() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const status = searchParams.get("status"); // success, failed

    const [emailSent, setEmailSent] = useState(false);
    const orderId = searchParams.get("order_id");

    useEffect(() => {
        let isMounted = true;
        console.log("PaymentProcessing mounted. Status:", status, "Order ID:", orderId);

        const verifyPayment = async () => {
            if (status === "success" && orderId && !emailSent) {
                try {
                    console.log("Verifying payment status with Xendit for Order:", orderId);

                    // Call payment-gateway with verify action (using fetch for anon key)
                    const res = await fetch(
                        "https://qftuhnkzyegcxfozdfyz.supabase.co/functions/v1/payment-gateway",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                            },
                            body: JSON.stringify({
                                action: 'verify',
                                order_id: orderId
                            })
                        }
                    );

                    const data = await res.json();

                    if (!isMounted) return;

                    if (!res.ok || data.error) {
                        console.error("Error invoking verification:", data.error || "Unknown error");
                    } else {
                        console.log("Verification Response:", data);
                        if (data?.success) {
                            console.log("Payment Verified Successfully.");
                            if (data.processing?.emailSuccess) {
                                console.log("✅ EMAIL SENT SUCCESSFULLY via Payment Gateway!");
                            } else {
                                console.warn("⚠️ Payment verified but email might not have been sent. Check 'processing' object:", data.processing);
                            }
                        } else {
                            console.warn("Payment verification returned success=false:", data);
                        }
                    }

                    setEmailSent(true);
                } catch (err) {
                    if (isMounted) console.error("Exception during verification:", err);
                }
            } else if (status === "success" && !orderId) {
                console.warn("Status is success but NO Order ID found in URL. Cannot trigger email from frontend.");
            }
        };

        verifyPayment();

        return () => {
            isMounted = false;
        };
    }, [status, orderId]); // Removed emailSent from dependency array to avoid double-firing logic issue, handled effectively by local ref or just the initial check

    if (!status) {
        // Fallback if accessed without status
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p>Invalid Access</p>
            </div>
        );
    }

    return (
        <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900 flex flex-col">
            <Navbar alwaysScrolled={true} />

            <div className="flex-grow flex items-center justify-center py-20 px-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden text-center p-8 space-y-6 animate-fade-in-up">

                    {status === "success" ? (
                        <>
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaCheckCircle className="text-6xl text-green-500" />
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-3xl font-black text-slate-900">Pembayaran Berhasil!</h1>
                                <p className="text-slate-500 font-medium">Terima kasih telah melakukan pembayaran.</p>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                                <p className="text-sm text-slate-600 mb-2">E-Tiket Anda telah dikirimkan ke email.</p>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Silakan cek inbox / spam folder Anda</p>
                            </div>

                            <div className="space-y-3 pt-4">
                                <button
                                    onClick={() => navigate(orderId ? `/transaction-detail/${orderId}` : "/")}
                                    className="w-full py-4 bg-[#1b3bb6] hover:bg-[#16319c] text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition-all"
                                >
                                    {orderId ? "Lihat Detail Tiket" : "Kembali ke Beranda"}
                                </button>
                                {/* Optional: Add button to view ticket detail if order_id is available */}
                                {/* <button onClick={() => navigate(`/transaction-detail/${orderId}`)} ... >Lihat Tiket</button> */}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaTimesCircle className="text-6xl text-red-500" />
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-3xl font-black text-slate-900">Pembayaran Gagal</h1>
                                <p className="text-slate-500 font-medium">Maaf, pembayaran Anda tidak dapat diproses.</p>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                                <p className="text-sm text-slate-600">Silakan coba lagi atau gunakan metode pembayaran lain.</p>
                            </div>

                            <div className="space-y-3 pt-4">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-200 transition-all"
                                >
                                    Coba Lagi
                                </button>
                                <button
                                    onClick={() => navigate("/")}
                                    className="w-full py-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-all"
                                >
                                    Kembali ke Beranda
                                </button>
                            </div>
                        </>
                    )}

                </div>
            </div>

            <Footer />
        </div>
    );
}
