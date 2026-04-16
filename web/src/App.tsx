import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Navbar, MobileNav } from "./components/Navbar";
import { Footer } from "./components/Footer";
import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/ChatPage";
import AdminPage from "./pages/AdminPage";

function AppContent() {
  const location = useLocation();
  const isChat = location.pathname.includes("/chat");
  const isAdmin = location.pathname.includes("/admin");
  const hideGlobalUI = isChat || isAdmin;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {!hideGlobalUI && <Navbar />}
      <main className={`flex-grow ${isChat ? 'h-screen overflow-hidden' : ''}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/pitaya" replace />} />
          <Route path="/:tenantId" element={<LandingPage />} />
          <Route path="/:tenantId/chat" element={<ChatPage />} />
          <Route path="/:tenantId/admin" element={<AdminPage />} />
        </Routes>
      </main>
      {!hideGlobalUI && <Footer />}
      {!hideGlobalUI && <MobileNav />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
