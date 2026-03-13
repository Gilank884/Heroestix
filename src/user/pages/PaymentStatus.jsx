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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase font-bold tracking-widest text-gray-400">
            Mengecek Status Pembayaran...
        </div>
    );
}
