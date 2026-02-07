import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import EventNavbar from "../../components/Layout/EventNavbar";
import Footer from "../../components/Layout/Footer";
import { HiOutlineDuplicate } from "react-icons/hi";
import { emailService } from "../../services/email";
import { supabase } from "../../lib/supabaseClient";

const rupiah = (value) => {
    if (typeof value !== "number" || isNaN(value)) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};

export default function Payment() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { total, selectedPayment, orderId, eventTitle, visitorEmail } = location.state || { total: 0, selectedPayment: "bca", orderId: null, eventTitle: "", visitorEmail: "" };

    const [timeLeft, setTimeLeft] = useState(28 * 60 + 3);
    const [activeTab, setActiveTab] = useState("MBanking");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!orderId) {
            navigate(`/`);
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [orderId, navigate]);

    const formatTime = (seconds) => {
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("Nomor Virtual Account disalin!");
    };

    const handleSimulatePayment = async () => {
        setLoading(true);
        try {
            // 1. Create Transaction
            const { error: transError } = await supabase
                .from("transactions")
                .insert({
                    order_id: orderId,
                    amount: total,
                    method: selectedPayment,
                    status: "success"
                });

            if (transError) throw transError;

            // 2. Update Order Status
            const { error: orderError } = await supabase
                .from("orders")
                .update({ status: "paid" })
                .eq("id", orderId);

            if (orderError) throw orderError;

            // 3. Update Ticket Types "sold" count (increment) and Record Creator Earnings
            const { data: orderTickets, error: fetchOrderTicketsError } = await supabase
                .from("tickets")
                .select(`
                    id,
                    ticket_type_id,
                    ticket_types (
                        name,
                        price,
                        price_net,
                        events (
                            creator_id
                        )
                    )
                `)
                .eq("order_id", orderId);

            if (fetchOrderTicketsError) {
                console.error("Error fetching order tickets for updates:", fetchOrderTicketsError);
            } else if (orderTickets && orderTickets.length > 0) {
                const typeCounts = {};
                const creatorEarnings = []; // Array to store balance entries

                orderTickets.forEach(t => {
                    const typeId = t.ticket_type_id;
                    typeCounts[typeId] = (typeCounts[typeId] || 0) + 1;

                    // Prepare earning entry for each ticket
                    if (t.ticket_types?.events?.creator_id) {
                        creatorEarnings.push({
                            creator_id: t.ticket_types.events.creator_id,
                            order_id: orderId,
                            ticket_id: t.id,
                            amount: t.ticket_types.price_net || t.ticket_types.price || 0,
                            type: 'credit',
                            description: `Ticket Sale: ${t.ticket_types.name}`
                        });
                    }
                });

                // 3a. Record earnings in creator_balances
                if (creatorEarnings.length > 0) {
                    const { error: balanceError } = await supabase
                        .from('creator_balances')
                        .insert(creatorEarnings);

                    if (balanceError) console.error("Error recording creator earnings:", balanceError);
                }

                // 3b. Update sold counts
                for (const [typeId, count] of Object.entries(typeCounts)) {
                    const { error: rpcError } = await supabase.rpc('increment_ticket_sold', {
                        t_id: typeId,
                        quantity: count
                    });

                    if (rpcError) {
                        const { data: currentType } = await supabase
                            .from('ticket_types')
                            .select('sold')
                            .eq('id', typeId)
                            .single();

                        if (currentType) {
                            await supabase
                                .from('ticket_types')
                                .update({ sold: (currentType.sold || 0) + count })
                                .eq('id', typeId);
                        }
                    }
                }
            }

            // 4. Send Email Notification
            // 4. Send Email Notification
            await emailService.sendTicketEmail(orderId, visitorEmail);

            alert("Pembayaran Berhasil! Tiket Anda telah diterbitkan.");
            navigate(`/transaction-detail/${orderId}`, {
                state: {
                    total: total,
                    selectedPayment: selectedPayment
                }
            });

        } catch (error) {
            console.error("Payment error:", error);
            alert("Error processing payment: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white min-h-screen font-sans text-slate-900">
            <EventNavbar />

            <div className="pt-32 pb-20">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="text-center space-y-2 mb-8">
                        <p className="font-bold text-slate-700">Selesaikan Pembayaran dalam</p>
                        <p className="text-3xl font-black text-orange-500 tracking-wider">
                            {formatTime(timeLeft)}
                        </p>
                    </div>

                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm mb-6">
                        <div className="flex divide-x divide-slate-50">
                            <div className="flex-1 p-6 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400">Nomor Akun Virtual</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-lg font-black text-slate-800 tracking-tight">3816529350750232</p>
                                        <button onClick={() => copyToClipboard("3816529350750232")} className="text-slate-400 hover:text-blue-600 transition-colors">
                                            <HiOutlineDuplicate size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400">Total</p>
                                    <p className="text-lg font-black text-slate-800">{rupiah(total)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400">Event</p>
                                    <p className="text-sm font-bold text-slate-700">{eventTitle}</p>
                                </div>
                            </div>
                            <div className="w-1/3 p-6 flex items-center justify-center bg-slate-50/50">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center min-w-[100px]">
                                    {(() => {
                                        const logos = {
                                            "bca": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bank_Central_Asia.svg/2560px-Bank_Central_Asia.svg.png",
                                            "mandiri": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Bank_Mandiri_logo_2016.svg/1200px-Bank_Mandiri_logo_2016.svg.png",
                                            "bni": "https://upload.wikimedia.org/wikipedia/id/thumb/5/55/BNI_logo.svg/1200px-BNI_logo.svg.png",
                                            "bri": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/BANK_BRI_logo.svg/1200px-BANK_BRI_logo.svg.png",
                                            "gopay": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Gopay_logo.svg/1200px-Gopay_logo.svg.png",
                                            "ovo": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Logo_ovo_purple.svg/1200px-Logo_ovo_purple.svg.png",
                                            "dana": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Logo_dana_blue.svg/1200px-Logo_dana_blue.svg.png",
                                            "shopeepay": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Shopee.svg/1200px-Shopee.svg.png"
                                        };

                                        const logoUrl = logos[selectedPayment?.toLowerCase()];

                                        if (logoUrl) {
                                            return (
                                                <img
                                                    src={logoUrl}
                                                    alt={selectedPayment}
                                                    className="h-8 w-auto object-contain"
                                                />
                                            );
                                        }

                                        return (
                                            <span className="font-black text-blue-700 italic text-xl uppercase">
                                                {selectedPayment}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-4">
                        <button
                            disabled={loading}
                            onClick={() => {
                                setLoading(true);
                                navigate(`/payment/processing?order_id=${orderId}&amount=${total}`);
                            }}
                            className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-xl ${loading ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
                        >
                            {loading ? "REDIRECTING TO PAYMENT..." : "PAY NOW"}
                        </button>
                    </div>

                    <button
                        onClick={() => navigate(-1)}
                        className="w-full py-3 rounded-xl border border-slate-100 text-slate-400 font-bold text-sm hover:bg-slate-50 transition-all mb-6"
                    >
                        Change Payment Method
                    </button>

                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-50 bg-white">
                            <h2 className="text-lg font-bold text-slate-800">Cara Membayar</h2>
                        </div>
                        <div className="flex border-b border-slate-50">
                            {["MBanking", "ATM"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab === tab ? 'text-blue-700' : 'text-slate-400 bg-slate-50/20'}`}
                                >
                                    {tab}
                                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-700" />}
                                </button>
                            ))}
                        </div>
                        <div className="p-8 space-y-8 bg-white">
                            <div className="space-y-4">
                                <h3 className="font-black text-slate-800">Masuk Ke Akun Anda</h3>
                                <ul className="space-y-2 text-sm font-medium text-slate-600 list-decimal pl-4">
                                    <li>Buka Aplikasi {selectedPayment.toUpperCase()} Mobile</li>
                                    <li>Pilih 'Transfer' atau 'Bayar'</li>
                                    <li>Masukkan Nomor Virtual Account di atas</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
