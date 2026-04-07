import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-auto hidden w-full flex-col items-center gap-4 bg-slate-50 py-8 px-6 text-center md:flex">
      <div className="flex gap-8">
        <Link to="/" className="text-xs font-normal text-slate-500 hover:text-slate-800 transition-all">Privacidad</Link>
        <Link to="/" className="text-xs font-normal text-slate-500 hover:text-slate-800 transition-all">Términos</Link>
        <Link to="/" className="text-xs font-normal text-slate-500 hover:text-slate-800 transition-all">Soporte</Link>
      </div>
      <p className="text-xs font-normal text-slate-500">© 2024 Concierge AI. Precision & Fluidity.</p>
    </footer>
  );
}
