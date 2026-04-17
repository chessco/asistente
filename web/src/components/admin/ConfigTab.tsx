import { motion } from "motion/react";
import { Settings } from "lucide-react";

interface Props {
  businessName: string;
  setBusinessName: (val: string) => void;
  calendarId: string;
  setCalendarId: (val: string) => void;
  whatsapp: string;
  setWhatsapp: (val: string) => void;
  config: any;
  setConfig: (val: any) => void;
  googleClientEmail: string;
  setGoogleClientEmail: (val: string) => void;
  googlePrivateKey: string;
  setGooglePrivateKey: (val: string) => void;
  onSave: () => void;
  saving: boolean;
}

export default function ConfigTab({
  businessName, setBusinessName,
  calendarId, setCalendarId,
  whatsapp, setWhatsapp,
  config, setConfig,
  googleClientEmail, setGoogleClientEmail,
  googlePrivateKey, setGooglePrivateKey,
  onSave, saving
}: Props) {

  const toggleDay = (day: number) => {
    const newDays = config.days.includes(day)
      ? config.days.filter((d: number) => d !== day)
      : [...config.days, day].sort();
    setConfig({ ...config, days: newDays });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="premium-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 bg-white/40 backdrop-blur-md shadow-2xl border border-white/40 max-w-4xl mx-auto"
    >
      <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
        <Settings className="text-primary" /> Configuración del Negocio
      </h2>

      <div className="space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-widest text-xs">Nombre del Negocio</label>
                <input 
                    type="text" 
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full rounded-2xl border-none bg-white p-4 font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
                />
            </div>
            <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-on-surface-variant uppercase tracking-widest text-xs">WhatsApp (lada+número)</label>
                <input 
                    type="text" 
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-2xl border-none bg-white p-4 font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
                />
            </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-bold text-on-surface-variant uppercase tracking-widest text-xs">ID de Calendario Google</label>
          <input 
            type="text" 
            placeholder="primary o ej: c_12345@group.calendar.google.com"
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
            className="w-full rounded-2xl border-none bg-white p-4 font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 space-y-6">
            <h3 className="text-sm font-black uppercase text-primary tracking-widest">Credenciales Propias (Opcional)</h3>
            <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Client Email</label>
                <input 
                    type="text" 
                    placeholder="service-account@your-project.iam.gserviceaccount.com"
                    value={googleClientEmail}
                    onChange={(e) => setGoogleClientEmail(e.target.value)}
                    className="w-full rounded-xl border-none bg-white p-3 text-sm shadow-inner"
                />
            </div>
            <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Private Key</label>
                <textarea 
                    rows={3}
                    placeholder="-----BEGIN PRIVATE KEY-----\n..."
                    value={googlePrivateKey}
                    onChange={(e) => setGooglePrivateKey(e.target.value)}
                    className="w-full rounded-xl border-none bg-white p-3 text-xs shadow-inner font-mono"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-on-surface-variant uppercase tracking-widest text-xs">Hora de Inicio</label>
            <input 
              type="time" 
              value={config.start}
              onChange={(e) => setConfig({ ...config, start: e.target.value })}
              className="rounded-2xl border-none bg-white p-4 font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-on-surface-variant uppercase tracking-widest text-xs">Hora de Cierre</label>
            <input 
              type="time" 
              value={config.end}
              onChange={(e) => setConfig({ ...config, end: e.target.value })}
              className="rounded-2xl border-none bg-white p-4 font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <label className="text-sm font-bold text-on-surface-variant uppercase tracking-widest text-xs">Días de Atención</label>
          <div className="flex flex-wrap gap-3">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day, i) => (
              <button
                key={day}
                onClick={() => toggleDay(i)}
                className={`h-12 w-12 rounded-xl font-bold transition-all ${
                  config.days.includes(i)
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                    : "bg-surface-container-low text-on-surface-variant/40"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={onSave}
          disabled={saving}
          className="w-full bg-primary text-on-primary rounded-2xl py-5 text-lg font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </motion.div>
  );
}
