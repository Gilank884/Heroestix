// App.jsx
import { Routes, Route } from "react-router-dom";

import Home from "./Pages/Home";
import AboutUsPage from "./Pages/about-us";
import Error from "./Pages/Error";
import Daftar from "./Pages/Daftar";
import Profile from "./Pages/Profile"
import Masuk from "./Pages/Masuk"



export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about-us" element={<AboutUsPage />} />
      <Route path="/daftar" element={<Daftar />} />
      <Route path="/masuk" element={<Masuk />} />
      <Route path="/error" element={<Error />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}
