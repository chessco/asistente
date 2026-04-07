import { Link, useLocation } from "react-router-dom";
import { Bot, User, Menu, MessageSquare, Calendar, Settings, Home } from "lucide-react";
import { motion } from "motion/react";

export function Navbar() {
  const location = useLocation();
  const isChat = location.pathname === "/chat";

  return (
    <header className="glass-nav sticky top-0 z-50 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <Bot className="text-primary h-6 w-6" />
          <span className="text-xl font-bold tracking-tight text-slate-900">Concierge AI</span>
        </Link>
        
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Servicios</Link>
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Precios</Link>
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Contacto</Link>
          <Link 
            to="/chat" 
            className="bg-primary text-on-primary rounded-lg px-5 py-2 text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
          >
            WhatsApp
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button className="rounded-full p-2 text-slate-600 hover:bg-blue-50 transition-all">
            <User className="h-6 w-6" />
          </button>
          <button className="p-2 text-slate-600 md:hidden">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: "Inicio", path: "/" },
    { icon: Bot, label: "Chatbot", path: "/chat" },
    { icon: Calendar, label: "Citas", path: "/chat" },
    { icon: Settings, label: "Ajustes", path: "/" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around bg-white/80 px-4 pt-2 pb-safe backdrop-blur-lg shadow-[0px_-12px_32px_rgba(25,28,30,0.04)] md:hidden rounded-t-2xl">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link 
            key={item.label}
            to={item.path}
            className={`flex flex-col items-center justify-center py-2 transition-all ${
              isActive ? "text-primary" : "text-slate-400"
            }`}
          >
            <item.icon className={`h-6 w-6 ${isActive ? "fill-primary/10" : ""}`} />
            <span className="mt-1 text-[11px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
