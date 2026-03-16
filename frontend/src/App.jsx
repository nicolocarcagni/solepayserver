import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/useAuthStore";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import InvoicesPage from "./pages/InvoicesPage";
import SettingsPage from "./pages/SettingsPage";

function RequireAuth({ children }) {
  const apiKey = useAuthStore((s) => s.apiKey);
  if (!apiKey) return <Navigate to="/settings" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Sidebar />}>
          <Route
            index
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="invoices"
            element={
              <RequireAuth>
                <InvoicesPage />
              </RequireAuth>
            }
          />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
