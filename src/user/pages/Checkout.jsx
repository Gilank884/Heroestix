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
    const [eventTax, setEventTax] = useState(null);
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [voucherLoading, setVoucherLoading] = useState(false);


    // State for multiple ticket holders
    const [ticketHolders, setTicketHolders] = useState([]);

    // Initialize ticket holders based on selected tickets
    useEffect(() => {
        if (selectedTickets && ticketTypes.length > 0) {
            const holders = [];
            Object.entries(selectedTickets).forEach(([typeId, count]) => {
                const type = ticketTypes.find(t => t.id === typeId);
                for (let i = 0; i < count; i++) {
                    holders.push({
                        id: `${typeId}-${i}`, // Unique ID for key
                        ticketTypeId: typeId,
                        ticketName: type?.name || "Ticket",
                        index: i + 1,
                        full_name: i === 0 && holders.length === 0 ? (user?.full_name || "") : "", // Pre-fill first one if empty
                        email: i === 0 && holders.length === 0 ? (user?.email || "") : "",
                        phone: "",
                        birth_day: "1",
                        birth_month: "Januari",
                        birth_year: "2000",
                        gender: "Laki - Laki",
                        notes: "",
                        custom_responses: {}
                    });
                }
            });
            // Only set if empty (initial load) to avoid overwriting user input on re-renders if dependencies change unpredictably
            // However, we need to be careful. For now, simple initialization if length doesn't match total count.
            setTicketHolders(prev => {
                if (prev.length === 0) return holders;
                return prev;
            });
        }
    }, [selectedTickets, ticketTypes, user]);

    // Update first holder if "Same as Buyer" is toggled (Logic moved to BuyerDetails or handled here)
    // We'll handle "Copy Buyer Data" in the UI components for flexibility.

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

        const fetchEventTax = async () => {
            try {
                const { data, error } = await supabase
                    .from("event_taxes")
                    .select("*")
                    .eq("event_id", id)
                    .maybeSingle();
                if (error) throw error;
                setEventTax(data);
            } catch (error) {
                console.error("Error fetching event tax:", error);
            }
        };

        fetchTicketTypes();
        fetchEventData();
        fetchEventTax();
        window.scrollTo(0, 0);
    }, [id, navigate]);

    if (!event) return null;

    const platformFee = 8500;

    // Calculate Tax Amount
    const taxAmount = eventTax ? (
        eventTax.is_included
            ? 0 // Tax is already in the price
            : Math.round((totalAmount * (parseFloat(eventTax.value) || 0)) / 100)
    ) : 0;

    // Step 2 Validation: Check if all required fields are filled for ALL holders
    const isNextDisabled = !termsAgreed || ticketHolders.some(h => !h.full_name || !h.email || !h.phone);

    const handleApplyVoucher = async (code) => {
        if (!code) {
            setAppliedVoucher(null);
            return;
        }

        setVoucherLoading(true);
        console.log("[Voucher] Applying code:", code, "for event:", id);
        try {
            const response = await supabase.functions.invoke('redeem-voucher', {
                body: {
                    code: code,
                    event_id: id,
                    total_amount: totalAmount
                }
            });

            console.log("[Voucher] Full response:", response);

            // Check if the function returned an error
            if (response.error) {
                // Try to read the error message from the response body
                let errorMessage = "Gagal memvalidasi voucher";

                if (response.response) {
                    try {
                        const errorBody = await response.response.json();
                        errorMessage = errorBody.error || errorMessage;
                    } catch (e) {
                        console.error("[Voucher] Failed to parse error response:", e);
                    }
                }

                console.error("[Voucher] Error:", errorMessage);
                alert(errorMessage);
                return;
            }

            // Success case
            console.log("[Voucher] Success:", response.data);
            setAppliedVoucher(response.data);
        } catch (error) {
            console.error("[Voucher] Exception:", error);
            alert(error.message || "Gagal memvalidasi voucher");
        } finally {
            setVoucherLoading(false);
        }
    };

    const handleCreateOrder = async () => {
        if (isNextDisabled) {
            alert("Harap lengkapi data semua pengunjung.");
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

        const discountAmount = appliedVoucher?.discount_amount || 0;
        const finalCalculatedTotal = Math.max(0, totalAmount - discountAmount) + platformFee + taxAmount;

        setLoading(true);
        try {
            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert({
                    user_id: currentUser.id,
                    total: finalCalculatedTotal,
                    status: "pending",
                    booking_code: bookingCode,
                    voucher_id: appliedVoucher?.voucher_id || null,
                    discount_amount: discountAmount
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Tickets for each type and quantity using SPECIFIC holder data
            const ticketsToCreate = ticketHolders.map(holder => {
                // Generate Custom QR Code: HRT + 5 Random + First/Last Event Char
                const prefix = "HRT";
                const randomChars = [...Array(5)].map(() => Math.random().toString(36)[2]).join('').toUpperCase();

                const eventTitle = event?.title || eventData?.title || "EVENT";
                const cleanTitle = eventTitle.trim();
                const firstChar = cleanTitle.charAt(0).toUpperCase();
                const lastChar = cleanTitle.charAt(cleanTitle.length - 1).toUpperCase();

                const customQrCode = `${prefix}${randomChars}${firstChar}${lastChar}`;

                return {
                    order_id: order.id,
                    ticket_type_id: holder.ticketTypeId,
                    qr_code: customQrCode,
                    status: "unused",
                    full_name: holder.full_name,
                    email: holder.email,
                    phone: holder.phone,
                    gender: holder.gender,
                    birth_date: `${holder.birth_day} ${holder.birth_month} ${holder.birth_year}`,
                    notes: holder.notes,
                    custom_responses: holder.custom_responses
                };
            });

            const { error: ticketError } = await supabase
                .from("tickets")
                .insert(ticketsToCreate);

            if (ticketError) throw ticketError;

            // 3. Call payment-gateway Edge Function to Initiate Transaction
            console.log("[Order] Initiating order with amount:", finalCalculatedTotal);
            const { data: gatewayData, error: gatewayError } = await supabase.functions.invoke('payment-gateway', {
                body: {
                    action: 'initiate',
                    order_id: order.id,
                    amount: finalCalculatedTotal,
                    customer_email: ticketHolders[0].email, // Use primary contact
                    customer_name: ticketHolders[0].full_name,
                    customer_phone: ticketHolders[0].phone
                }
            });

            if (gatewayError) {
                console.error("[Order] Gateway error:", gatewayError);
                throw gatewayError;
            }

            console.log("[Order] Gateway success:", gatewayData);

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
            setShowValidationErrors(true);

            // More specific error message
            if (!termsAgreed) {
                alert("Harap setujui Syarat & Ketentuan untuk melanjutkan.");
            } else {
                alert("Harap lengkapi data pengunjung (Nama, Email, dan No. HP).");
            }
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
        <div className="bg-[#f8fafc] dark:bg-slate-950 min-h-screen font-sans text-slate-900 dark:text-slate-100">
            <Navbar alwaysScrolled={true} />

            <div className="pt-28 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* STEPPER */}
                    <div className="flex items-center justify-center gap-6 mb-12">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 ${currentStep >= 1 ? 'bg-[#1a36c7] text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-900/40' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>1</div>
                            <span className={`font-black text-xs uppercase tracking-[0.15em] ${currentStep >= 1 ? 'text-[#1a36c7] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>Detail Pembeli</span>
                        </div>
                        <div className={`w-12 h-[2px] rounded-full transition-all duration-500 ${currentStep >= 2 ? 'bg-[#1a36c7]' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 ${currentStep >= 2 ? 'bg-[#1a36c7] text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-900/40' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>2</div>
                            <span className={`font-black text-xs uppercase tracking-[0.15em] ${currentStep >= 2 ? 'text-[#1a36c7] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>Konfirmasi</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: STEPS */}
                        <div className="lg:col-span-8 space-y-8">
                            {currentStep === 1 ? (
                                <BuyerDetails
                                    user={user}
                                    ticketHolders={ticketHolders}
                                    setTicketHolders={setTicketHolders}
                                    ticketTypes={ticketTypes}
                                    selectedTickets={selectedTickets}
                                    eventData={eventData}
                                    event={event}
                                    termsAgreed={termsAgreed}
                                    setTermsAgreed={setTermsAgreed}
                                    showValidationErrors={showValidationErrors}
                                />
                            ) : (
                                <OrderConfirmation
                                    ticketHolders={ticketHolders}
                                    selectedTickets={selectedTickets}
                                    ticketTypes={ticketTypes}
                                    totalAmount={totalAmount}
                                    platformFee={platformFee}
                                    taxAmount={taxAmount}
                                    eventTax={eventTax}
                                    appliedVoucher={appliedVoucher}
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
                                platformFee={platformFee}
                                taxAmount={taxAmount}
                                eventTax={eventTax}
                                currentStep={currentStep}
                                onNext={handleNextStep}
                                onPrev={handlePrevStep}
                                onPay={handleCreateOrder}
                                loading={loading}
                                isNextDisabled={false} // Enable button to allow validation check on click
                                appliedVoucher={appliedVoucher}
                                onApplyVoucher={handleApplyVoucher}
                                voucherLoading={voucherLoading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
