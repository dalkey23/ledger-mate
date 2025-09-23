import React from "react";
import "./App.css";
import { Link, Route, Routes, Navigate } from "react-router-dom";
import ReceiptsPage from "./pages/ReceiptsPage";
import UploadPage from "./pages/UploadPage";

function App() {
  return (
    <main className="app">
      <header>
        <nav >
          <Link to="/upload">엑셀 업로드</Link>
          <Link to="/receipts">증빙관리</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/upload" replace />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/receipts" element={<ReceiptsPage />} />
      </Routes>
    </main>
  );
}

export default App;
