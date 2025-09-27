import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import RecordsPage from "./pages/RecordsPage";
import UploadPage from "./pages/UploadPage";
import LandingPage from "./pages/LandingPage";

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

export default App;
