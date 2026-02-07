import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Layout/Navbar";
import Footer from "../../components/Layout/Footer";
import useAuthStore from "../../auth/useAuthStore";
import { supabase } from "../../lib/supabaseClient";

// Import new components
import BuyerDetails from "../components/checkout/BuyerDetails";
import OrderConfirmation from "../components/checkout/OrderConfirmation";
import OrderSummary from "../components/checkout/OrderSummary";

export default function Checkout() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { selectedTickets, totalAmount, event } = location.state || { selectedTickets: {}, totalAmount: 0, event: null };

    const [sameAsBuyer, setSameAsBuyer] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [ticketTypes, setTicketTypes] = useState([]);
    const [eventData, setEventData] = useState(null);
    const [termsAgreed, setTermsAgreed] = useState(false);

    // Form states for first visitor
    const [visitorData, setVisitorData] = useState({
        full_name: user?.full_name || "",
        email: user?.email || "",
        phone: "",
        birth_day: "1",
        birth_month: "Januari",
        birth_year: "2000",
        gender: "Laki - Laki",
        notes: "",
        custom_responses: {}
    });

    useEffect(() => {
        if (sameAsBuyer) {
            setVisitorData(prev => ({
                ...prev,
                full_name: user?.full_name || "",
                email: user?.email || ""
            }));
        }
    }, [sameAsBuyer, user]);

    useEffect(() => {
        if (!event) {
            navigate(`/event/${id}`);
            return;
        }

        const fetchTicketTypes = async () => {
            try {
                const { data, error } = await supabase
                    .from("ticket_types")
                    .select("*")
                    .eq("event_id", id);
                if (error) throw error;
                setTicketTypes(data || []);
            } catch (error) {
                console.error("Error fetching ticket types:", error);
            }
        };

        const fetchEventData = async () => {
            try {
                const { data, error } = await supabase
                    .from("events")
                    .select("*")
                    .eq("id", id)
                    .single();
                if (error) throw error;
                setEventData(data);
            } catch (error) {
                console.error("Error fetching event data:", error);
            }
        };

        fetchTicketTypes();
        fetchEventData();
        window.scrollTo(0, 0);
    }, [id, navigate]);

    if (!event) return null;

    const internetFee = 8500;

    // Step 2 Validation: Check if all required fields are filled
    const isNextDisabled = !termsAgreed || !visitorData.full_name || !visitorData.email || !visitorData.phone;

    const handleCreateOrder = async () => {
        if (!visitorData.full_name || !visitorData.email || !visitorData.phone) {
            alert("Harap lengkapi data pengunjung utama.");
            return;
        }

        // Ensure user is logged in or get user from session
        let currentUser = user;
        if (!currentUser) {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            currentUser = authUser;
        }

        if (!currentUser) {
            alert("Sesi anda telah berakhir. Silakan login kembali.");
            return;
        }

        const bookingCode = `HT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        setLoading(true);
        try {
            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert({
                    user_id: currentUser.id,
                    total: totalAmount + internetFee,
                    status: "pending",
                    booking_code: bookingCode
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Tickets for each type and quantity
            const ticketsToCreate = [];
            Object.entries(selectedTickets).forEach(([typeId, count]) => {
                for (let i = 0; i < count; i++) {
                    ticketsToCreate.push({
                        order_id: order.id,
                        ticket_type_id: typeId,
                        qr_code: `QR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                        status: "unused",
                        full_name: visitorData.full_name,
                        email: visitorData.email,
                        phone: visitorData.phone,
                        gender: visitorData.gender,
                        birth_date: `${visitorData.birth_day} ${visitorData.birth_month} ${visitorData.birth_year}`,
                        notes: visitorData.notes,
                        custom_responses: visitorData.custom_responses
                    });
                }
            });

            const { error: ticketError } = await supabase
                .from("tickets")
                .insert(ticketsToCreate);

            if (ticketError) throw ticketError;

            // 3. Call payment-gateway Edge Function to Initiate Transaction
            // This creates a 'transactions' record which is required for the verification step.
            // Using fetch to ensure correct Authorization header with Anon Key
            const res = await fetch(
                "https://qftuhnkzyegcxfozdfyz.supabase.co/functions/v1/payment-gateway",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    },
                    body: JSON.stringify({
                        action: 'initiate',
                        order_id: order.id,
                        amount: totalAmount + internetFee,
                        customer_email: visitorData.email,
                        customer_name: visitorData.full_name,
                        customer_phone: visitorData.phone
                    }),
                }
            );

            const gatewayData = await res.json();

            if (!res.ok || gatewayData.error) {
                throw new Error(gatewayData.error || "Payment gateway error");
            }

            // Redirect to Xendit invoice page
            if (gatewayData?.redirect_url) {
                window.location.href = gatewayData.redirect_url;
            } else {
                throw new Error("Invoice URL not found in response");
            }

        } catch (error) {
            alert("Error creating order: " + error.message);
            setLoading(false);
        }
    };

    const handleNextStep = () => {
        if (isNextDisabled) {
            alert("Harap lengkapi data dan setujui syarat & ketentuan.");
            return;
        }
        setCurrentStep(2);
        window.scrollTo(0, 0);
    };

    const handlePrevStep = () => {
        setCurrentStep(1);
        window.scrollTo(0, 0);
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-900">
            <Navbar alwaysScrolled={true} />

            <div className="pt-28 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* STEPPER */}
                    <div className="flex items-center justify-center gap-6 mb-12">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 ${currentStep >= 1 ? 'bg-[#1a36c7] text-white shadow-lg shadow-blue-500/30' : 'bg-slate-200 text-slate-400'}`}>1</div>
                            <span className={`font-black text-xs uppercase tracking-[0.15em] ${currentStep >= 1 ? 'text-[#1a36c7]' : 'text-slate-400'}`}>Detail Pembeli</span>
                        </div>
                        <div className={`w-12 h-[2px] rounded-full transition-all duration-500 ${currentStep >= 2 ? 'bg-[#1a36c7]' : 'bg-slate-200'}`}></div>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 ${currentStep >= 2 ? 'bg-[#1a36c7] text-white shadow-lg shadow-blue-500/30' : 'bg-slate-200 text-slate-400'}`}>2</div>
                            <span className={`font-black text-xs uppercase tracking-[0.15em] ${currentStep >= 2 ? 'text-[#1a36c7]' : 'text-slate-400'}`}>Konfirmasi</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: STEPS */}
                        <div className="lg:col-span-8 space-y-8">
                            {currentStep === 1 ? (
                                <BuyerDetails
                                    user={user}
                                    visitorData={visitorData}
                                    setVisitorData={setVisitorData}
                                    ticketTypes={ticketTypes}
                                    selectedTickets={selectedTickets}
                                    eventData={eventData}
                                    event={event}
                                    termsAgreed={termsAgreed}
                                    setTermsAgreed={setTermsAgreed}
                                />
                            ) : (
                                <OrderConfirmation
                                    visitorData={visitorData}
                                    selectedTickets={selectedTickets}
                                    ticketTypes={ticketTypes}
                                    totalAmount={totalAmount}
                                    internetFee={internetFee}
                                />
                            )}
                        </div>

                        {/* RIGHT COLUMN: SIDEBAR */}
                        <div className="lg:col-span-4">
                            <OrderSummary
                                event={event}
                                selectedTickets={selectedTickets}
                                ticketTypes={ticketTypes}
                                totalAmount={totalAmount}
                                internetFee={internetFee}
                                currentStep={currentStep}
                                onNext={handleNextStep}
                                onPrev={handlePrevStep}
                                onPay={handleCreateOrder}
                                loading={loading}
                                isNextDisabled={isNextDisabled}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
