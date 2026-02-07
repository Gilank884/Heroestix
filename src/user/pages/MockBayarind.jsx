import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { transactionService } from "../../services/transactions";
import { FaCreditCard, FaLock } from "react-icons/fa";

export default function MockBayarind() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const trxId = searchParams.get("trx_id");
    const amount = searchParams.get("amount");
    const vaNumber = searchParams.get("va");

    const handlePayment = async (status) => {
        try {
            // 1. Trigger Callback (Simulating Server-to-Server call)
            await transactionService.sendMockCallback({
                transaction_id: trxId,
                status: status,
            });

            // 2. Redirect User to Merchant Receipt
            if (status === 'success') {
                navigate(`/payment/receipt?trx_id=${trxId}`);
            } else {
                navigate(`/payment/receipt?trx_id=${trxId}&error=failed`);
            }

        } catch (error) {
            console.error("Mock Payment Error:", error);
            alert("Error processing payment simulation");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full border-t-8 border-blue-600">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-blue-800 italic">sPrint payment</h1>
                    <FaLock className="text-green-500" />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <p className="text-sm text-blue-600 font-semibold mb-1">Total Amount</p>
                    <p className="text-3xl font-bold text-blue-900">Rp {parseInt(amount || 0).toLocaleString()}</p>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="border p-4 rounded-lg bg-blue-50 border-blue-200">
                        <p className="text-xs font-bold text-blue-500 uppercase mb-1">Virtual Account Number</p>
                        <div className="flex items-center justify-between">
                            <p className="text-xl font-mono font-black text-blue-900">{vaNumber || "888800000000"}</p>
                            <FaCreditCard className="text-blue-300" />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => handlePayment('success')}
                        className="w-full py-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition shadow-lg hover:shadow-green-200"
                    >
                        Approve Payment (Success)
                    </button>
                    <button
                        onClick={() => handlePayment('failed')}
                        className="w-full py-4 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200 transition"
                    >
                        Decline Payment (Failed)
                    </button>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    This is a mock payment page for testing purposes only.
                </p>
            </div>
        </div>
    );
}
