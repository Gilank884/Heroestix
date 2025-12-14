// App.jsx
import { Routes, Route } from "react-router-dom";

import Home from "./Pages/Home";
import AboutUsPage from "./Pages/about-us";
import Error from "./Pages/Error";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about-us" element={<AboutUsPage />} />
      <Route path="/error" element={<Error />} />
    </Routes>
  );
}
