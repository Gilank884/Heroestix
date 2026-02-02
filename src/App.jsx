import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import ScrollToTop from "./components/ScrollToTop";

// User Pages
import Home from "./user/pages/Home";
import AboutUsPage from "./user/pages/about-us";
import Error from "./user/pages/Error";
import Daftar from "./user/pages/Daftar";
import Profile from "./user/pages/Profile"
import Masuk from "./user/pages/Masuk"
import EventDetail from "./user/pages/EventDetail";
import SelectTicket from "./user/pages/SelectTicket";
import Checkout from "./user/pages/Checkout";
import Payment from "./user/pages/Payment";
import TransactionDetail from "./user/pages/TransactionDetail";
import CreatorPage from "./user/pages/CreatorPage";
import PrivacyPolicy from "./user/pages/PrivacyPolicy";
import TermsOfService from "./user/pages/TermsOfService";

// Layouts
import CreatorLayout from "./creator/layouts/CreatorLayout";
import EventManagementLayout from "./creator/layouts/EventManagementLayout";
import DevLayout from "./dev/layouts/DevLayout";

// Creator Pages
import CreatorDashboard from "./creator/pages/Dashboard";
import CreatorDaftar from "./creator/pages/Daftar";
import Events from "./creator/pages/Events";
import CreatorEventDetail from "./creator/pages/EventDetail"; // Renamed to avoid conflict with user-side EventDetail
import Tickets from "./creator/pages/Tickets";
import Scan from "./creator/pages/Scan";
import TicketCategories from "./creator/pages/TicketCategories";
import Visitors from "./creator/pages/Visitors";
import SalesReport from "./creator/pages/SalesReport";
import Withdrawals from "./creator/pages/Withdrawals";
import EventSalesReport from "./creator/pages/EventSalesReport";
import EventWithdrawals from "./creator/pages/EventWithdrawals";
import EventValidationStats from "./creator/pages/EventValidationStats";
import EventCheckIn from "./creator/pages/EventCheckIn";
import EventCash from "./creator/pages/EventCash";
import AdditionalForm from "./creator/pages/AdditionalForm";
import CreatorProfile from "./creator/pages/Profile";

// Dev Pages
import DevDashboard from "./dev/pages/Dashboard";
import DevCash from "./dev/pages/Cash";
import DevCreators from "./dev/pages/Creators";
import DevEvents from "./dev/pages/Events";



// Guards
import CreatorGuard from "./guards/CreatorGuard";
import DevGuard from "./guards/DevGuard";
import useAuthStore from "./auth/useAuthStore";

// New User Pages
import BecomeCreator from "./user/pages/BecomeCreator";
import { getBaseDomain, getSubdomainUrl } from "./lib/navigation";




export default function App() {
  const [subdomain, setSubdomain] = useState(null);

  useEffect(() => {
    const host = window.location.hostname;
    const baseDomain = getBaseDomain();

    if (host.startsWith("creator.")) {
      setSubdomain("creator");
    } else if (host.startsWith("dev.")) {
      setSubdomain("dev");
    } else {
      setSubdomain("user");
    }
  }, []);


  const { login, logout, setChecking } = useAuthStore();

  useEffect(() => {
    // 🔗 Restore Session from Hash (Cross-Subdomain Bridge for Localhost)
    const restoreSession = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes("access_token=") && hash.includes("refresh_token=")) {
        console.log("Found session tokens in URL hash, attempting to restore session...");
        setChecking(true);
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) {
            console.log("Session restored successfully from hash.");
            // Clean hash without leaving a '#'
            window.history.replaceState(null, null, window.location.pathname + window.location.search);
          } else {
            console.error("Error restoring session from hash:", error.message);
            setChecking(false);
          }
        } else {
          setChecking(false);
        }
      }
    };
    restoreSession();



    const checkRedirect = async (session) => {
      if (session?.user) {
        console.log("Active session found for user:", session.user.id, "email:", session.user.email);
        setChecking(true);
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        const authMode = localStorage.getItem("auth_mode");
        console.log("Current auth_mode from localStorage:", authMode);

        if (!profile) {
          console.log("Profile not found in database for user:", session.user.id);
          // If profile doesn't exist and they are registering OR logging in with Google
          const isGoogleProvider = session.user.app_metadata?.provider === "google";

          if (authMode === "register" || isGoogleProvider) {
            const role = localStorage.getItem("auth_role") || "user";
            console.log(`Auto-creating profile for ${isGoogleProvider ? "Google user" : "registering user"}. Role: ${role}`);

            // Create profile
            const { error: createError } = await supabase.from("profiles").upsert({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.nama || session.user.user_metadata?.full_name || "Google User",
              role: role,
            });

            if (!createError) {
              console.log("Profile created/updated successfully.");
              // Call login even if we reload, to ensure store is populated
              login(session.user, session.access_token, role);
            } else {
              console.error("CRITICAL: Error creating profile in database:", createError.message);
              console.error("This usually happens due to RLS policies or missing table. Error code:", createError.code);
            }

            if (!createError && role === "creator") {
              console.log("Creating/Updating creator record with metadata:", {
                brand_name: session.user.user_metadata?.brand_name,
                bank_name: session.user.user_metadata?.bank_name
              });
              // Also create creator record with metadata from user_metadata
              const { error: creatorError } = await supabase.from("creators").upsert({
                id: session.user.id,
                brand_name: session.user.user_metadata?.brand_name || "My Brand",
                bank_name: session.user.user_metadata?.bank_name || "",
                bank_account: session.user.user_metadata?.bank_account || "",
                verified: false
              });

              if (!creatorError) {
                console.log("Creator record created/updated successfully.");
              } else {
                console.error("CRITICAL: Error creating creator record in database:", creatorError.message);
              }
            }

            localStorage.removeItem("auth_mode");
            localStorage.removeItem("auth_role");
            console.log("Auth sequence complete. Reloading page to finalize...");
            window.location.reload(); // Still helpful to clear hash/params cleanly
            return;
          } else {
            // Unregistered user trying to login (manual email)
            console.warn("Unregistered user (manual login) attempted. Redirecting to error.");
            logout();
            await supabase.auth.signOut();
            localStorage.removeItem("auth_mode");
            window.location.href = window.location.origin + "/masuk?error=unregistered";
            return;
          }
        }

        if (profile) {
          localStorage.removeItem("auth_mode");
          localStorage.removeItem("auth_role");

          const role = profile.role;

          // SYNC STORE
          login(session.user, session.access_token, role);

          const host = window.location.hostname;
          const isLocalhost = host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
          const port = window.location.port ? `:${window.location.port}` : "";
          const baseDomain = getBaseDomain();
          const isBaseDomain = host === baseDomain;
          const isCreatorSub = host.startsWith("creator.");
          const isDevSub = host.startsWith("dev.");

          // 🔄 CROSS-SUBDOMAIN REDIRECTION LOGIC
          // Rule: Only redirect if on the WRONG subdomain, OR if explicitly logging in/registering
          const shouldForceRedirect = authMode === "login" || authMode === "register";

          if (role === "creator") {
            if (isDevSub || (shouldForceRedirect && !isCreatorSub)) {
              window.location.href = getSubdomainUrl("creator", isLocalhost ? `#access_token=${session.access_token}&refresh_token=${session.refresh_token}` : "");
              return;
            }
          } else if (role === "developer") {
            if (isCreatorSub || (shouldForceRedirect && !isDevSub)) {
              window.location.href = getSubdomainUrl("dev", isLocalhost ? `#access_token=${session.access_token}&refresh_token=${session.refresh_token}` : "");
              return;
            }
          } else if (role === "user") {
            if (isCreatorSub || isDevSub) {
              window.location.href = getSubdomainUrl(null);
              return;
            }
          }
        }
      } else {
        // No session
        logout();
        setChecking(false);
      }
    };

    // 1. Initial Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkRedirect(session);
    });

    // 2. Listen for changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Only re-check if session actually changes or explicitly signs in/out
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        checkRedirect(session);
      }
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  if (subdomain === null) return null;

  if (subdomain === "creator") {
    return (
      <Routes>
        <Route path="/masuk" element={<Masuk role="creator" />} />
        <Route path="/daftar" element={<CreatorDaftar />} />
        <Route
          path="*"
          element={
            <CreatorGuard>
              <Routes>
                {/* 1. Event Specific Management (Dedicated Layout) */}
                <Route path="/manage/event/:id/*" element={
                  <EventManagementLayout>
                    <Routes>
                      <Route path="/" element={<CreatorEventDetail />} />
                      <Route path="/ticket-categories" element={<TicketCategories />} />
                      <Route path="/visitors" element={<Visitors />} />
                      <Route path="/check-in-stats" element={<EventValidationStats />} />
                      <Route path="/check-in" element={<EventCheckIn />} />
                      <Route path="/vouchers" element={<div className="p-10 font-bold text-2xl text-gray-800">Event Vouchers (Work in Progress)</div>} />
                      <Route path="/staff" element={<div className="p-10 font-bold text-2xl text-gray-800">Event Staff (Work in Progress)</div>} />
                      <Route path="/sales-report" element={<EventSalesReport />} />
                      <Route path="/withdrawals" element={<EventWithdrawals />} />
                      <Route path="/additional-form" element={<AdditionalForm />} />
                    </Routes>

                  </EventManagementLayout>
                } />

                {/* 2. Standard Creator Portal (Main Layout) */}
                <Route path="*" element={
                  <CreatorLayout>
                    <Routes>
                      <Route path="/" element={<CreatorDashboard />} />
                      <Route path="/events" element={<Events />} />
                      <Route path="/tickets" element={<Tickets />} />
                      <Route path="/scan" element={<Scan />} />
                      <Route path="/staff" element={<div className="p-10 font-bold text-2xl text-gray-800">Staff Management (Work in Progress)</div>} />
                      <Route path="/vouchers" element={<div className="p-10 font-bold text-2xl text-gray-800">Voucher & Promotions (Work in Progress)</div>} />
                      <Route path="/sales-report" element={<SalesReport />} />
                      <Route path="/withdrawals" element={<Withdrawals />} />
                      <Route path="/reports" element={<div className="p-10 font-bold text-2xl text-gray-800">Data Recap & Reports (Work in Progress)</div>} />
                      <Route path="/security/password" element={<div className="p-10 font-bold text-2xl text-gray-800">Change Password (Work in Progress)</div>} />
                      <Route path="/security/tokens" element={<div className="p-10 font-bold text-2xl text-gray-800">Token Generator (Work in Progress)</div>} />
                      <Route path="/tools/bracelet-printing" element={<div className="p-10 font-bold text-2xl text-gray-800">Cetak Tiket Gelang (Work in Progress)</div>} />
                      <Route path="/profile" element={<CreatorProfile />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </CreatorLayout>
                } />
              </Routes>
            </CreatorGuard>
          }
        />
      </Routes>
    );
  }

  if (subdomain === "dev") {
    return (
      <Routes>
        <Route path="/masuk" element={<Masuk role="developer" />} />
        <Route path="/daftar" element={<div>Dev Registration Not Allowed</div>} />
        <Route
          path="*"
          element={
            <DevGuard>
              <DevLayout>
                <Routes>
                  <Route path="/" element={<DevDashboard />} />
                  <Route path="/creators" element={<DevCreators />} />
                  <Route path="/events" element={<DevEvents />} />
                  <Route path="/cash" element={<DevCash />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </DevLayout>
            </DevGuard>
          }
        />
      </Routes>
    );
  }



  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<AboutUsPage />} />
        <Route path="/daftar" element={<Daftar />} />
        <Route path="/masuk" element={<Masuk />} />
        <Route path="/masuk" element={<Masuk />} />
        <Route path="/error" element={<Error />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/select-ticket/:id" element={<SelectTicket />} />
        <Route path="/checkout/:id" element={<Checkout />} />
        <Route path="/payment/:id" element={<Payment />} />
        <Route path="/transaction-detail/:id" element={<TransactionDetail />} />
        <Route path="/become-creator" element={<BecomeCreator />} />
        <Route path="/creator/:id" element={<CreatorPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
