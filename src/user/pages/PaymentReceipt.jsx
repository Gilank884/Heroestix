import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { transactionService } from "../../services/transactions";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function PaymentReceipt() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    // We can look for status from URL or query the DB using reference
    const trxId = searchParams.get("trx_id");
    const orderId = location.state?.orderId;
    const [dbStatus, setDbStatus] = useState("loading"); // loading, success, failed

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // 1. If we have orderId from state, check DB directly
                if (orderId) {
                    const { data, error } = await supabase
                        .from('orders')
                        .select('status')
                        .eq('id', orderId)
                        .single();

                    if (data?.status === 'paid') {
                        setDbStatus("success");
                    } else {
                        setDbStatus("failed");
                    }
                    return;
                }

                // 2. Fallback to trxId if present
                if (trxId) {
                    // Simulate verification for now or query transactions table
                    setTimeout(() => {
                        setDbStatus("success");
                    }, 1000);
                    return;
                }

                setDbStatus("failed");
            } catch (error) {
                console.error("Receipt verification error:", error);
                setDbStatus("failed");
            }
        };

        checkStatus();
    }, [trxId, orderId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
            {dbStatus === "loading" ? (
                <div className="flex flex-col items-center">
                    <FaSpinner className="text-4xl text-blue-600 animate-spin mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">Verifying Payment...</h2>
                </div>
            ) : dbStatus === "success" ? (
                <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full border border-green-100">
                    <div className="flex justify-center mb-6">
                        <FaCheckCircle className="text-6xl text-green-500 shadow-green-200 drop-shadow-lg" />
                    </div>
                    <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
                    <p className="text-gray-500 mb-8">
                        Your transaction {trxId ? `#${trxId.slice(0, 8)}...` : ""} has been processed successfully.
                        You will receive an email confirmation shortly.
                    </p>

                    <div className="flex flex-col gap-3">
                        <Link
                            to={`/transaction-detail/${orderId}`}
                            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg hover:shadow-blue-200"
                        >
                            View My Ticket
                        </Link>
                        <Link
                            to="/"
                            className="w-full py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full border border-red-100">
                    <div className="flex justify-center mb-6">
                        <FaTimesCircle className="text-6xl text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-red-600 mb-2">Payment Failed</h1>
                    <p className="text-gray-500 mb-8">
                        We couldn't process your payment. Please try again or contact support.
                    </p>

                    <Link
                        to="/"
                        className="px-8 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition"
                    >
                        Go Home
                    </Link>
                </div>
            )}
        </div>
    );
}
