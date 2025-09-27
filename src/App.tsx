import { useRoutes } from "react-router-dom";
import RecordsPage from "./pages/RecordsPage";
import UploadPage from "./pages/UploadPage";
import LandingPage from "./pages/LandingPage";

export default function App() {
  const routes = useRoutes([
    { path: "/", element: <LandingPage /> },
    { path: "/upload", element: <UploadPage /> },
    { path: "/records", element: <RecordsPage /> },
  ]);
  return routes;
}

