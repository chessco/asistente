import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar, MobileNav } from "./components/Navbar";
import { Footer } from "./components/Footer";
import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/ChatPage";

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-surface">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Routes>
        </main>
        <Footer />
        <MobileNav />
      </div>
    </Router>
  );
}
