import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Clock, Shield, Globe, MessageSquare, Zap } from "lucide-react";
import API_BASE_URL from "../api-config";

export default function LandingPage() {
  const { tenantId = "pitaya" } = useParams();
  const [whatsapp, setWhatsapp] = useState("5216441942690");
  const [businessName, setBusinessName] = useState("");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/${tenantId}/config`);
        const data = await res.json();
        if (data.whatsappNumber) setWhatsapp(data.whatsappNumber);
        if (data.name) setBusinessName(data.name);
      } catch (error) {
        console.error("Error fetching public config:", error);
      }
    };
    fetchConfig();
  }, [tenantId]);

  const whatsappUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hola, vengo de CitaIA. Me gustaría más información.")}`;

  return (
    <div className="flex flex-col bg-surface">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-24 md:pb-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10"
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Zap className="h-3 w-3" /> CitaIA by Pitaya Schedly
            </span>
            <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-on-surface md:text-7xl">
              {businessName || "Tu asistente"} con <span className="text-primary italic">CitaIA</span>
            </h1>
            <p className="mb-10 max-w-lg text-lg leading-relaxed text-on-surface-variant md:text-xl">
              Responde al instante y agenda citas automáticamente. Brinda una experiencia premium 24/7 sin esfuerzo manual.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link 
                to={`/${tenantId}/chat`}
                className="bg-primary text-on-primary flex items-center justify-center rounded-2xl px-10 py-5 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px] hover:shadow-2xl active:scale-95"
              >
                Iniciar Chat
              </Link>
              <a 
                href={`https://wa.me/${whatsapp}?text=Hola,%20vengo%20de%20CitaIA.%20Me%20gustaría%20más%20información.`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-surface-container-lowest border border-white text-on-surface flex items-center justify-center gap-2 rounded-2xl px-10 py-5 text-lg font-bold transition-all hover:bg-white/80 premium-card"
              >
                Continuar en WhatsApp
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-8 rounded-[3rem] bg-primary/5 blur-3xl"></div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2.5rem] bg-surface-container-low shadow-2xl">
              <img 
                src="/hero-citaia.png" 
                alt="Asistente Digital Experto"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              {/* Layered Floating Card */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="absolute right-8 bottom-8 flex max-w-xs items-center gap-4 rounded-3xl border border-white/40 bg-white/70 p-5 shadow-2xl backdrop-blur-xl"
              >
                <div className="bg-emerald-100 text-emerald-600 flex h-12 w-12 items-center justify-center rounded-full shadow-inner">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Cita Agendada</p>
                  <p className="text-xs text-on-surface-variant">Consulta hoy a las 4:00 PM</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features - No Borders, Tonal Shifting */}
      <section id="servicios" className="bg-surface-container-low py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-20 text-center">
            <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl text-on-surface font-display">
              Precisión Clínica & Fluidez <span className="text-primary-container">Digital</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-on-surface-variant font-sans">
              Diseñado para centros médicos, clínicas estéticas y consultorios que buscan lo mejor.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Featured Item */}
            <div className="premium-card rounded-4xl p-12 md:col-span-2">
              <div className="bg-primary/5 text-primary mb-8 flex h-14 w-14 items-center justify-center rounded-2xl">
                <Clock className="h-7 w-7" />
              </div>
              <h3 className="mb-5 text-3xl font-bold">Agenda Inteligente</h3>
              <p className="text-lg leading-relaxed text-on-surface-variant">
                Nuestro motor CitaIA procesa el lenguaje natural para encontrar el espacio perfecto en tu calendario, igual que un concierge humano.
              </p>
              <div className="mt-10 flex gap-3">
                <div className="h-1.5 w-16 rounded-full bg-primary italic"></div>
                <div className="h-1.5 w-8 rounded-full bg-primary/20"></div>
                <div className="h-1.5 w-8 rounded-full bg-primary/20"></div>
              </div>
            </div>

            {/* Dark Accent Item */}
            <div className="bg-slate-900 text-white rounded-4xl p-12 shadow-2xl flex flex-col justify-end">
              <MessageSquare className="mb-8 h-12 w-12 text-primary-container" />
              <h3 className="mb-4 text-2xl font-bold">Canal Centralizado</h3>
              <p className="opacity-80 text-lg">
                Convierte mensajes de WhatsApp en citas confirmadas sin que muevas un solo dedo.
              </p>
            </div>

            {/* Third Item */}
            <div className="premium-card rounded-4xl p-12">
              <div className="bg-emerald-50 text-emerald-600 mb-8 flex h-14 w-14 items-center justify-center rounded-2xl">
                <Shield className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-2xl font-bold">Privacidad Total</h3>
              <p className="text-on-surface-variant">
                Datos encriptados de extremo a extremo, cumpliendo con los estándares de salud más exigentes.
              </p>
            </div>

            {/* Platform Integration Item */}
            <div id="nosotros" className="premium-card rounded-4xl p-12 md:col-span-2 flex flex-col gap-10 md:flex-row md:items-center">
              <div className="flex-1">
                <h3 className="mb-4 text-2xl font-bold">Multicanal by Schedly</h3>
                <p className="text-lg text-on-surface-variant">
                  Integración fluida con todas tus plataformas. CitaIA vive donde tus pacientes te necesitan.
                </p>
              </div>
              <div className="flex -space-x-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white flex h-16 w-16 items-center justify-center rounded-full border-[6px] border-surface-container-low shadow-xl">
                    <Globe className="text-primary h-8 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="contacto" className="py-24 px-6">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[3.5rem] bg-slate-950 p-12 text-center md:py-24 md:px-20 border border-white/5">
          <div className="absolute top-0 right-0 -mr-40 -mt-40 h-80 w-80 bg-primary/20 blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 -ml-40 -mb-40 h-80 w-80 bg-emerald-500/10 blur-[120px]"></div>
          
          <h2 className="relative z-10 mb-8 text-4xl font-extrabold text-white md:text-6xl tracking-tight leading-tight">
            Eleva tu práctica con <span className="text-primary-container italic">CitaIA</span>
          </h2>
          <p className="relative z-10 mx-auto mb-16 max-w-2xl text-xl text-slate-400">
            Únete a la nueva era de la medicina inteligente by Pitaya Schedly.
          </p>
          <div className="relative z-10 flex flex-col justify-center gap-5 sm:flex-row">
            <Link 
              to={`/${tenantId}/chat`}
              className="bg-primary text-on-primary rounded-2xl px-12 py-6 text-xl font-bold shadow-2xl transition-all hover:bg-primary-container hover:scale-[1.02] active:scale-95"
            >
              Comenzar Ahora
            </Link>
            <button className="border-slate-800 text-slate-300 hover:bg-slate-900/50 hover:text-white rounded-2xl border px-12 py-6 text-xl font-bold transition-all backdrop-blur-sm">
              Solicitar Demo
            </button>
          </div>
        </div>
      </section>
      
      {/* Footer Branding */}
      <footer className="py-12 border-t border-slate-100/10 text-center">
        <p className="text-sm text-on-surface-variant/60 font-medium">
          CitaIA © 2026 — Un producto de <span className="text-primary-container font-bold">Pitaya Schedly</span>
        </p>
      </footer>

      {/* Floating Chat Bubble */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <Link 
          to={`/${tenantId}/chat`}
          className="bg-primary text-on-primary flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 animate-pulse-slow"
        >
          <MessageSquare className="h-8 w-8" />
        </Link>
      </motion.div>
    </div>
  );
}
