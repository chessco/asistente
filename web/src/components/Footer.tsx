import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-auto hidden w-full flex-col items-center gap-6 bg-surface py-12 px-6 text-center md:flex border-t border-slate-100/10">
      <div className="flex gap-10">
        <Link to="/" className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-all">Privacidad</Link>
        <Link to="/" className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-all">Términos</Link>
        <Link to="/" className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-all">Soporte</Link>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/20 italic">
        CitaIA © 2026 — Un producto de <span className="text-primary/40">Pitaya Schedly</span>
      </p>
    </footer>
  );
}
