// App.jsx
import { Routes, Route } from "react-router-dom";

import Home from "./Pages/Home";
import AboutUsPage from "./Pages/about-us";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about-us" element={<AboutUsPage />} />
    </Routes>
  );
}
