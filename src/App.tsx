import { Routes, Route } from "react-router-dom";
import Layout from "@/layouts/Layout";
import LandingPage from "@/pages/LandingPage";
import UploadPage from "@/pages/UploadPage";
import RecordsByPartyPage from "@/pages/RecordsByPartyPage";
import PartyRecordsPage from "@/pages/PartyRecordsPage";


export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/records/parties" element={<RecordsByPartyPage />} />
        <Route path="/records/parties/:partyId" element={<PartyRecordsPage />} />
      </Route>
    </Routes>
  );
}
