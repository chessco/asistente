import { motion } from "motion/react";
import { Search, ExternalLink, RefreshCcw } from "lucide-react";

interface Appointment {
  id: string;
  patient: string;
  service: string;
  startTime: string;
  htmlLink: string;
  status: string;
  paymentStatus?: string;
  amount?: number;
}

interface Props {
  appointments: Appointment[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

export default function AppointmentsList({ appointments, searchTerm, setSearchTerm, loading, onRefresh }: Props) {
  const filtered = appointments.filter(app => 
    app.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="premium-card overflow-hidden rounded-[2.5rem] bg-white/40 backdrop-blur-md shadow-2xl border border-white/40">
      <div className="flex flex-col gap-4 border-b border-white/20 p-6 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant/50" />
          <input 
            type="text" 
            placeholder="Buscar por paciente o servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border-none bg-surface-container-low py-3.5 pl-12 pr-6 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/50 text-xs font-bold uppercase tracking-widest text-on-surface-variant/70">
              <th className="px-8 py-5">Paciente</th>
              <th className="px-8 py-5">Servicio</th>
              <th className="px-8 py-5">Fecha & Hora</th>
              <th className="px-8 py-5 text-center">Estado</th>
              <th className="px-8 py-5 text-center">Pago</th>
              <th className="px-8 py-5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map((app, i) => (
              <motion.tr 
                key={app.id}
                className="hover:bg-white/50 transition-all"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {app.patient.charAt(0)}
                    </div>
                    <p className="font-bold text-on-surface">{app.patient}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="inline-flex rounded-lg bg-surface-container-low px-2.5 py-1 text-xs font-bold text-on-surface">
                    {app.service}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <p className="font-bold text-on-surface">
                      {new Date(app.startTime).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(app.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                    app.status === 'confirmada' ? 'bg-emerald-500/10 text-emerald-600' :
                    app.status === 'cancelada' ? 'bg-red-500/10 text-red-600' :
                    'bg-amber-500/10 text-amber-600'
                  }`}>
                    {app.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center">
                        <span className={`text-[10px] font-black tracking-tighter ${
                            app.paymentStatus === 'pagada' ? 'text-emerald-600' : 
                            (app.paymentStatus === 'n/a' ? 'text-on-surface-variant/30' : 'text-amber-600')
                        }`}>
                            {app.paymentStatus === 'pagada' ? 'PAGADO' : (app.paymentStatus === 'n/a' ? 'N/A' : 'PENDIENTE')}
                        </span>
                        {app.amount ? (
                            <span className="text-[10px] font-bold opacity-30 leading-none">${app.amount}</span>
                        ) : null}
                    </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <a href={app.htmlLink} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:text-primary transition-all hover:bg-white hover:shadow-xl">
                    <ExternalLink size={16} />
                  </a>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-surface-container-low/50 p-6 text-center">
          <p className="text-xs font-bold text-on-surface-variant/40 uppercase tracking-widest flex items-center justify-center gap-2">
            <RefreshCcw className="h-3 w-3" /> Datos sincronizados en tiempo real
          </p>
      </div>
    </div>
  );
}
