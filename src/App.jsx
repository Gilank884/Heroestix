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
import PaymentProcessing from "./user/pages/PaymentProcessing";
import PaymentReceipt from "./user/pages/PaymentReceipt";
import MockBayarind from "./user/pages/MockBayarind"; // Mock Import
import CreatorPage from "./user/pages/CreatorPage";

import PrivacyPolicy from "./user/pages/PrivacyPolicy";
import TermsOfService from "./user/pages/TermsOfService";
import CompleteRegistration from "./user/pages/CompleteRegistration"; // New Import

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
import Overview from "./creator/pages/Overview";
import Withdrawals from "./creator/pages/Withdrawals";
import EventSalesReport from "./creator/pages/EventSalesReport";
import EventWithdrawals from "./creator/pages/EventWithdrawals";
import EventValidationStats from "./creator/pages/EventValidationStats";
import EventCheckIn from "./creator/pages/EventCheckIn";
import EventCash from "./creator/pages/EventCash";
import AdditionalForm from "./creator/pages/AdditionalForm";
import CreateEvent from "./creator/pages/CreateEvent";
import CreatorProfile from "./creator/pages/Profile";

// Dev Pages
import DevDashboard from "./dev/pages/Dashboard";
import DevCash from "./dev/pages/Cash";
import DevCreators from "./dev/pages/Creators";
import DevCreatorDetail from "./dev/pages/CreatorDetail";
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
            return true; // Signal success
          } else {
            console.error("Error restoring session from hash:", error.message);
          }
        }
      }
      return false;
    };



    const checkRedirect = async (session) => {
      if (session?.user) {
        console.log("Active session found for user:", session.user.id, "email:", session.user.email);

        // Only set checking to true if we don't already have a valid session in store
        // This prevents flicker on tab return/navigation
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) {
          setChecking(true);
        }
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        const authMode = localStorage.getItem("auth_mode");
        const isExplicitAuth = !!authMode;
        console.log("Current auth_mode from localStorage:", authMode);

        if (!profile) {
          console.log("Profile not found in database for user:", session.user.id);
          // If profile doesn't exist and they are registering OR logging in with Google
          const isGoogleProvider = session.user.app_metadata?.provider === "google";

          // MODIFIED: If Google Provider, REDIRECT to Complete Registration instead of Auto-Create
          if ((authMode === "register" || isGoogleProvider)) {
            // If manual email register, profile should have been created in UserRegister.jsx, but if not, logic might fall here.
            // But for Google, we want to force completion.

            if (isGoogleProvider) {
              // Check if we are already on the completion page to avoid infinite loop
              if (window.location.pathname !== "/complete-registration") {
                window.location.href = getSubdomainUrl(null, "/complete-registration");
              }
              setChecking(false); // Stop checking, let them fill the form
              return;
            }

            // Below logic kept for reference or other providers, but strictly for Google we redirect above.
            // Actually, if it's manual register and NO profile, something went wrong in UserRegister.jsx or it's a legacy flow.
            // Let's keep the old auto-create as fallback for non-google if needed, although UserRegister handles it now.

            // ... Old Auto Create Logic Removed for Google ...
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
          // Rule: Redirect if on the WRONG subdomain
          // Note: we check authMode to see if this is an explicit login/register action
          const isAuthPath = window.location.pathname === "/masuk" || window.location.pathname === "/daftar";

          if (role === "creator") {
            // If on dev sub OR (on base sub AND (isExplicitAuth OR visiting root OR auth paths))
            if (isDevSub || (!isCreatorSub && (isExplicitAuth || window.location.pathname === "/" || isAuthPath))) {
              console.log("Redirecting creator to creator portal...");
              window.location.href = getSubdomainUrl("creator", isLocalhost ? `#access_token=${session.access_token}&refresh_token=${session.refresh_token}` : "");
              return;
            }
            // If already on creator portal but on auth path, send to dashboard
            if (isCreatorSub && isAuthPath) {
              window.location.href = "/";
              return;
            }
          } else if (role === "developer") {
            if (isCreatorSub || (!isDevSub && (isExplicitAuth || window.location.pathname === "/" || isAuthPath))) {
              console.log("Redirecting developer to dev portal...");
              window.location.href = getSubdomainUrl("dev", isLocalhost ? `#access_token=${session.access_token}&refresh_token=${session.refresh_token}` : "");
              return;
            }
            if (isDevSub && isAuthPath) {
              window.location.href = "/";
              return;
            }
          } else if (role === "user") {
            // Users should not be on internal subdomains except for registration completion
            const isCompletionPath = window.location.pathname === "/complete-registration";
            if ((isCreatorSub || isDevSub) && !isCompletionPath && !isAuthPath) {
              console.log("User detected on internal subdomain, redirecting to home portal...");
              window.location.href = getSubdomainUrl(null);
              return;
            }
            // If on base domain and on auth path while already logged in
            if (isBaseDomain && isAuthPath) {
              window.location.href = "/";
              return;
            }
          }
        }
        setChecking(false);
      } else {
        // No session
        logout();
        setChecking(false);
      }
    };

    // 1. Listen for changes FIRST (to catch INITIAL_SESSION or sign-ins)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth State Change:", event);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        checkRedirect(session);
      }
    });

    // 2. Initial Hash Sync & Session Check
    const initAuth = async () => {
      const restored = await restoreSession();
      if (!restored) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) checkRedirect(session);
        else setChecking(false);
      }
    };

    initAuth();

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
                      <Route path="/events/create" element={<CreateEvent />} />
                      <Route path="/tickets" element={<Tickets />} />
                      <Route path="/scan" element={<Scan />} />
                      <Route path="/staff" element={<div className="p-10 font-bold text-2xl text-gray-800">Staff Management (Work in Progress)</div>} />
                      <Route path="/vouchers" element={<div className="p-10 font-bold text-2xl text-gray-800">Voucher & Promotions (Work in Progress)</div>} />
                      <Route path="/sales-report" element={<Overview />} />
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
                  <Route path="/creators/:id" element={<DevCreatorDetail />} />
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
        <Route path="/payment/processing" element={<PaymentProcessing />} />
        <Route path="/payment/receipt" element={<PaymentReceipt />} />
        <Route path="/payment/mock-bayarind" element={<MockBayarind />} />
        <Route path="/transaction-detail/:id" element={<TransactionDetail />} />
        <Route path="/become-creator" element={<BecomeCreator />} />
        <Route path="/creator/:id" element={<CreatorPage />} />
        <Route path="/complete-registration" element={<CompleteRegistration />} /> {/* New Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
