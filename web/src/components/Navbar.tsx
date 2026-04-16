import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bot, User, Menu, MessageSquare, Calendar, Settings, Home, Sparkles, X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  // Extract tenantId from path (e.g., /pitaya/chat -> pitaya)
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const tenantId = pathSegments[0] || "pitaya";
  const isChat = location.pathname.includes("/chat");

  // Close menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { label: "Servicios", path: `/${tenantId}#servicios` },
    { label: "Nosotros", path: `/${tenantId}#nosotros` },
    { label: "Contacto", path: `/${tenantId}#contacto` },
  ];

  return (
    <header className="glass-nav sticky top-0 z-50 w-full border-white/10 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to={`/${tenantId}`} className="flex items-center gap-2 group relative z-[60]">
          <div className="bg-primary/5 p-2 rounded-xl group-hover:bg-primary/10 transition-colors">
            <Sparkles className="text-primary h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter text-on-surface leading-none font-display">CitaIA</span>
            <span className="text-[10px] font-bold text-primary/40 leading-none uppercase tracking-widest font-sans">by Schedly</span>
          </div>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <a 
              key={link.label}
              href={link.path}
              className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              {link.label}
            </a>
          ))}
          <Link 
            to={`/${tenantId}/chat`} 
            className="bg-primary text-on-primary rounded-xl px-6 py-2.5 text-sm font-black transition-all hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/20 active:scale-95"
          >
            Probar CitaIA
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 relative z-[60]">
          <Link 
            to={`/${tenantId}/admin`}
            title="Admin Dashboard"
            className="bg-surface-container-low rounded-xl p-2.5 text-on-surface-variant hover:bg-white transition-all shadow-sm hidden sm:block border border-black/5"
          >
            <Shield className="h-5 w-5" />
          </Link>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2.5 text-on-surface md:hidden flex items-center justify-center bg-surface-container-low rounded-xl transition-all"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-surface/95 backdrop-blur-xl flex flex-col p-8 pt-32 md:hidden"
          >
            <div className="flex flex-col gap-8">
              {navLinks.map((link, i) => (
                <motion.a 
                  key={link.label}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-4xl font-black text-on-surface tracking-tighter decoration-primary hover:underline"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="pt-8"
              >
                <Link 
                  to={`/${tenantId}/chat`} 
                  onClick={() => setIsOpen(false)}
                  className="bg-primary text-on-primary rounded-2xl w-full flex items-center justify-center py-5 text-xl font-black shadow-2xl shadow-primary/30"
                >
                  Probar CitaIA Ahora
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function MobileNav() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const tenantId = pathSegments[0] || "pitaya";
  
  const navItems = [
    { icon: Shield, label: "Admin", path: `/${tenantId}/admin` },
    { icon: Sparkles, label: "Chatbot", path: `/${tenantId}/chat` },
    { icon: Calendar, label: "Mis Citas", path: `/${tenantId}/chat` },
    { icon: Home, label: "Inicio", path: `/${tenantId}` },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around bg-surface/90 px-4 pt-3 pb-8 backdrop-blur-2xl shadow-[0px_-16px_40px_rgba(0,0,0,0.08)] md:hidden rounded-t-[2.5rem] border-t border-white/30">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link 
            key={item.label}
            to={item.path}
            className={`flex flex-col items-center justify-center p-2 transition-all relative ${
              isActive ? "text-primary" : "text-on-surface-variant/40"
            }`}
          >
            {isActive && (
              <motion.div 
                layoutId="activeNav"
                className="absolute -top-1 w-1 h-1 bg-primary rounded-full"
              />
            )}
            <item.icon className={`h-6 w-6 ${isActive ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
            <span className={`mt-1 text-[10px] font-black uppercase tracking-tighter ${isActive ? "opacity-100" : "opacity-60"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
