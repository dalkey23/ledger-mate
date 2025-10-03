import { Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout";
import LandingPage from "./pages/LandingPage";
import UploadPage from "./pages/UploadPage";
import RecordsPage from "./pages/RecordsPage";


export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/records" element={<RecordsPage />} />
      </Route>
    </Routes>
  );
}
