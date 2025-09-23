import React from "react";
import "./App.css";
import { Link, Route, Routes, Navigate, useLocation } from "react-router-dom";
import ReceiptsPage from "./pages/ReceiptsPage";
import UploadPage from "./pages/UploadPage";
import EditRecordModal from "./components/EditRecordModal";
import RecordDetailPage from "./pages/RecordDetailPage";

function App() {
  const location = useLocation();
  const state = location.state as { background?: Location };
  const background = state && state.background;

  return (
    <main className="app">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link to="/upload">엑셀 업로드</Link>
          <Link to="/receipts">증빙관리</Link>
        </nav>
      </header>


      <Routes location={background || location}>
        <Route path="/" element={<Navigate to="/upload" replace />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/receipts" element={<ReceiptsPage />} />
        <Route path="/records/:id" element={<RecordDetailPage />} />
        <Route path="*" element={<Navigate to="/upload" replace />} />
      </Routes>

      {background && (
        <Routes>
          <Route path="/records/:id" element={<EditRecordModal />} />
        </Routes>
      )}
    </main>
  );
}

export default App;
