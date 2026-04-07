import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Shield, Globe, MessageSquare } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-24 md:pb-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              Inteligencia Artificial para Clínicas
            </span>
            <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-on-surface md:text-7xl">
              Automatiza tu atención con IA
            </h1>
            <p className="mb-10 max-w-lg text-lg leading-relaxed text-on-surface-variant md:text-xl">
              Responde clientes al instante y agenda citas automáticamente. Brinda una experiencia premium 24/7 sin esfuerzo manual.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link 
                to="/chat"
                className="bg-primary text-on-primary flex items-center justify-center rounded-lg px-8 py-4 text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-xl active:scale-95"
              >
                Iniciar conversación
              </Link>
              <button className="bg-surface-container-high text-primary flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-lg font-bold transition-all hover:bg-surface-container-highest">
                Ir a WhatsApp
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative group"
          >
            <div className="absolute -inset-4 rounded-[2rem] bg-primary/5 blur-2xl transition-colors group-hover:bg-primary/10"></div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-surface-container-low shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1000" 
                alt="Modern Clinic"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Floating Micro-Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute right-6 bottom-6 flex max-w-xs items-center gap-4 rounded-xl border border-white/20 bg-white/90 p-4 shadow-xl backdrop-blur-md"
              >
                <div className="bg-emerald-100 text-emerald-600 flex h-10 w-10 items-center justify-center rounded-full">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">Cita Confirmada</p>
                  <p className="text-[10px] text-on-surface-variant">Consulta Dermatología - 14:30 PM</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-surface-container-low py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">Eficiencia en cada interacción</h2>
            <p className="mx-auto max-w-2xl text-on-surface-variant">Nuestra IA no solo responde; entiende el contexto de tu práctica médica para ofrecer soluciones precisas.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Featured Bento Item */}
            <div className="bg-white flex flex-col justify-between rounded-3xl border border-slate-200/50 p-10 shadow-sm md:col-span-2">
              <div>
                <div className="bg-primary/10 text-primary mb-6 flex h-12 w-12 items-center justify-center rounded-xl">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="mb-4 text-2xl font-bold">Agenda Inteligente</h3>
                <p className="leading-relaxed text-on-surface-variant">Sincronización directa con tu calendario. Los pacientes eligen sus turnos y reciben confirmaciones inmediatas sin intervención humana.</p>
              </div>
              <div className="mt-8 flex gap-2">
                <div className="h-1 w-12 rounded-full bg-primary"></div>
                <div className="h-1 w-6 rounded-full bg-primary/20"></div>
                <div className="h-1 w-6 rounded-full bg-primary/20"></div>
              </div>
            </div>

            {/* Side Bento Item */}
            <div className="bg-primary text-on-primary flex flex-col justify-center rounded-3xl p-10 shadow-lg">
              <MessageSquare className="mb-6 h-10 w-10" />
              <h3 className="mb-4 text-2xl font-bold">Atención 24/7</h3>
              <p className="leading-relaxed opacity-90">Nunca pierdas un prospecto. Tu clínica responde consultas incluso fuera de horario comercial.</p>
            </div>

            {/* Third Bento Item */}
            <div className="bg-white rounded-3xl border border-slate-200/50 p-10 shadow-sm">
              <div className="bg-emerald-50 text-emerald-600 mb-6 flex h-12 w-12 items-center justify-center rounded-xl">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-bold">Privacidad Médica</h3>
              <p className="text-sm text-on-surface-variant">Cumplimos con estándares de encriptación para proteger los datos sensibles de tus pacientes.</p>
            </div>

            {/* Fourth Bento Item */}
            <div className="bg-white flex flex-col gap-8 rounded-3xl border border-slate-200/50 p-10 shadow-sm md:col-span-2 md:flex-row md:items-center">
              <div className="flex-1">
                <h3 className="mb-3 text-xl font-bold">Integración Multicanal</h3>
                <p className="text-sm text-on-surface-variant">WhatsApp, Instagram y tu Sitio Web centralizados en un solo motor de inteligencia artificial.</p>
              </div>
              <div className="flex -space-x-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border-surface-container-low flex h-12 w-12 items-center justify-center rounded-full border-4 shadow-md">
                    <Globe className="text-primary h-6 w-6" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-slate-900 p-12 text-center md:p-20">
          <div className="absolute top-0 right-0 -mr-32 -mt-32 h-64 w-64 bg-primary/20 blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 -ml-32 -mb-32 h-64 w-64 bg-emerald-500/10 blur-[100px]"></div>
          
          <h2 className="relative z-10 mb-8 text-3xl font-extrabold text-white md:text-5xl">
            Transforma tu práctica hoy mismo
          </h2>
          <p className="relative z-10 mx-auto mb-12 max-w-2xl text-lg text-slate-400">
            Únete a más de 200 clínicas que han reducido su carga administrativa en un 60% usando Concierge AI.
          </p>
          <div className="relative z-10 flex flex-col justify-center gap-4 sm:flex-row">
            <button className="bg-white text-slate-950 rounded-xl px-10 py-5 text-lg font-bold shadow-xl transition-all hover:bg-slate-100 active:scale-95">
              Empezar Prueba Gratis
            </button>
            <button className="border-slate-700 text-white hover:bg-slate-800 rounded-xl border px-10 py-5 text-lg font-bold transition-all">
              Hablar con un asesor
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
