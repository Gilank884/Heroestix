// App.jsx
import { Routes, Route } from "react-router-dom";

import Home from "./Pages/Home";
import AboutUsPage from "./Pages/about-us";
import Error from "./Pages/Error";
import Daftar from "./Pages/Daftar";
import Profile from "./Pages/Profile"
import Masuk from "./Pages/Masuk"
import EventDetail from "./Pages/EventDetail";
import SelectTicket from "./Pages/SelectTicket";
import Checkout from "./Pages/Checkout";
import Payment from "./Pages/Payment";
import TransactionDetail from "./Pages/TransactionDetail";



export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about-us" element={<AboutUsPage />} />
      <Route path="/daftar" element={<Daftar />} />
      <Route path="/masuk" element={<Masuk />} />
      <Route path="/error" element={<Error />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/event/:id" element={<EventDetail />} />
      <Route path="/select-ticket/:id" element={<SelectTicket />} />
      <Route path="/checkout/:id" element={<Checkout />} />
      <Route path="/payment/:id" element={<Payment />} />
      <Route path="/transaction-detail/:id" element={<TransactionDetail />} />
    </Routes>
  );
}
