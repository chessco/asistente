import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import API_BASE_URL from "../api-config";
import { 
  Calendar, 
  Users, 
  Clock, 
  ExternalLink, 
  RefreshCcw, 
  Search,
  ChevronRight,
  TrendingUp,
  Filter,
  Settings,
  Shield,
  Plus,
  ArrowLeftRight,
  Database,
  Pencil,
  Check,
  X
} from "lucide-react";

interface Appointment {
  id: string;
  patient: string;
  service: string;
  startTime: string;
  htmlLink: string;
  status: string;
}

export default function AdminPage() {
  const { tenantId = "default" } = useParams();
  const [activeTab, setActiveTab] = useState<"citas" | "config" | "super">("citas");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Tenants for Super Admin
  const [tenants, setTenants] = useState<any[]>([]);
  const [newTenant, setNewTenant] = useState({ id: '', name: '' });
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  
  // Config state
  const [businessName, setBusinessName] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [config, setConfig] = useState({ 
    start: "09:00", 
    end: "18:00", 
    days: [1, 2, 3, 4, 5] 
  });
  const [whatsapp, setWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/${tenantId}/admin/appointments`);
      const data = await res.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/${tenantId}/admin/config`);
      const data = await res.json();
      setBusinessName(data.name || '');
      setConfig(data.businessHours);
      setWhatsapp(data.whatsappNumber || '');
      setCalendarId(data.calendarId || 'primary');
    } catch (error) {
      console.error("Error fetching config:", error);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/tenants`);
      const data = await res.json();
      setTenants(data);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    }
  };

  const createTenant = async () => {
    if (!newTenant.id) return alert("El ID es obligatorio");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTenant)
      });
      if (res.ok) {
        alert("Tenant creado con éxito");
        setNewTenant({ id: '', name: '' });
        fetchTenants();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error("Error creating tenant:", error);
    }
  };

  const updateTenantName = async (id: string) => {
    if (!tempName.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tempName })
      });
      if (res.ok) {
        setEditingTenantId(null);
        fetchTenants();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error("Error updating tenant name:", error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/api/${tenantId}/admin/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: businessName,
          calendarId: calendarId,
          businessHours: config, 
          whatsappNumber: whatsapp 
        })
      });
      alert("Configuración guardada correctamente");
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchAppointments();
    fetchTenants();
  }, [tenantId]);

  const toggleDay = (day: number) => {
    const newDays = config.days.includes(day)
      ? config.days.filter(d => d !== day)
      : [...config.days, day].sort();
    setConfig({ ...config, days: newDays });
  };

  const appointmentsTab = (
    <div className="flex flex-col gap-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { label: "Citas Próximas", value: appointments.length, icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Pacientes Únicos", value: new Set(appointments.map(a => a.patient)).size, icon: Users, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Días Laborales", value: config.days.length, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="premium-card rounded-3xl p-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
                <stat.icon className="h-7 w-7" />
              </div>
              <TrendingUp className="h-5 w-5 text-on-surface-variant/30" />
            </div>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">{stat.label}</p>
            <p className="text-4xl font-black text-on-surface">{stat.value}</p>
          </motion.div>
        ))}
      </div>

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
                <th className="px-8 py-5">Estado</th>
                <th className="px-8 py-5">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {appointments.filter(app => 
                app.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.service.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((app, i) => (
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
                  <td className="px-8 py-6">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase text-emerald-600">
                      {app.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <a href={app.htmlLink} target="_blank" rel="noreferrer" className="text-on-surface-variant hover:text-primary transition-colors">
                      <ExternalLink size={18} />
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
    </div>
  );

  const configTab = (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="premium-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 bg-white/40 backdrop-blur-md shadow-2xl border border-white/40 max-w-3xl mx-auto"
    >
      <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
        <Settings className="text-primary" /> Configuración del Negocio
      </h2>

      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col gap-3">
          <label className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Nombre del Negocio</label>
          <input 
            type="text" 
            placeholder="Ej: Clínica Dental Smile"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full rounded-2xl border-none bg-white p-4 text-xl font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">ID de Calendario Google</label>
          <input 
            type="text" 
            placeholder="primary o ej: c_12345@group.calendar.google.com"
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
            className="w-full rounded-2xl border-none bg-white p-4 text-xl font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-wider ml-1">
            Usa "primary" para tu calendario principal o el ID de un calendario compartido.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Hora de Inicio</label>
            <input 
              type="time" 
              value={config.start}
              onChange={(e) => setConfig({ ...config, start: e.target.value })}
              className="rounded-2xl border-none bg-white p-4 text-xl font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Hora de Cierre</label>
            <input 
              type="time" 
              value={config.end}
              onChange={(e) => setConfig({ ...config, end: e.target.value })}
              className="rounded-2xl border-none bg-white p-4 text-xl font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Número de WhatsApp (con lada)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 font-bold">+</span>
            <input 
              type="text" 
              placeholder="5216441234567"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-2xl border-none bg-white p-4 pl-8 text-xl font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <p className="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-wider ml-1">
            Ejemplo: 5216449991122 (Sin espacios ni símbolos)
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <label className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Días de Atención</label>
          <div className="flex flex-wrap gap-3">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day, i) => (
              <button
                key={day}
                onClick={() => toggleDay(i)}
                className={`h-14 w-14 rounded-2xl font-bold transition-all ${
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
          onClick={saveConfig}
          disabled={saving}
          className="w-full bg-primary text-on-primary rounded-2xl py-5 text-lg font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </motion.div>
  );

  const superAdminTab = (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Tenant Form */}
        <div className="premium-card rounded-[2.5rem] p-8 bg-white/40 backdrop-blur-md border border-white/40">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2">
            <Plus className="text-primary" /> Nuevo Tenant
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-on-surface-variant/60 uppercase">ID Único (URL)</label>
              <input 
                type="text" 
                placeholder="ej: clinica-dentista"
                value={newTenant.id}
                onChange={(e) => setNewTenant({ ...newTenant, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="rounded-xl border-none bg-white p-3 font-bold shadow-inner"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-on-surface-variant/60 uppercase">Nombre</label>
              <input 
                type="text" 
                placeholder="Nombre del Negocio"
                value={newTenant.name}
                onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                className="rounded-xl border-none bg-white p-3 font-bold shadow-inner"
              />
            </div>
            <button 
              onClick={createTenant}
              className="w-full bg-primary text-on-primary rounded-xl py-3.5 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Crear Tenant
            </button>
          </div>
        </div>

        {/* List of Tenants */}
        <div className="lg:col-span-2 premium-card rounded-[2.5rem] p-8 bg-white/40 backdrop-blur-md border border-white/40">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2">
            <Database className="text-primary" /> Gestionar Tenants
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tenants.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/60 border border-white/40 group hover:shadow-lg transition-all">
                <div className="flex-grow mr-4">
                  {editingTenantId === t.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="flex-grow rounded-lg border-none bg-white p-2 font-bold shadow-inner text-sm"
                        autoFocus
                      />
                      <button 
                        onClick={() => updateTenantName(t.id)}
                        className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => setEditingTenantId(null)}
                        className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-black text-on-surface leading-tight text-lg">{t.name}</p>
                        <p className="text-xs font-bold text-on-surface-variant/50 uppercase tracking-widest">{t.id}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setEditingTenantId(t.id);
                          setTempName(t.name);
                        }}
                        className="p-1.5 text-on-surface-variant/40 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  )}
                </div>
                {!editingTenantId && (
                  <button 
                    onClick={() => window.location.href = `/${t.id}/admin`}
                    className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2 text-xs font-black uppercase text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-all shadow-sm shrink-0"
                  >
                    <ArrowLeftRight size={14} /> Cambiar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case "citas": return appointmentsTab;
      case "config": return configTab;
      case "super": return superAdminTab;
      default: return appointmentsTab;
    }
  };

  return (
    <div className="min-h-screen bg-surface p-4 md:p-8 lg:p-12 pb-48 overflow-y-auto">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
              <Shield className="h-4 w-4" /> {businessName || tenantId}
            </div>
            <div className="flex gap-1 bg-surface-container-low p-1.5 rounded-3xl w-fit">
              <button 
                onClick={() => setActiveTab("citas")}
                className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'citas' ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-variant/50'}`}
              >
                Citas
              </button>
              <button 
                onClick={() => setActiveTab("config")}
                className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'config' ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-variant/50'}`}
              >
                Configuración
              </button>
              <button 
                onClick={() => setActiveTab("super")}
                className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'super' ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-variant/50'}`}
              >
                Super Admin
              </button>
            </div>
          </div>
          
          <button 
            onClick={fetchAppointments}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-surface-container-high px-6 py-3.5 font-bold text-on-surface shadow-sm transition-all hover:bg-surface-container-highest active:scale-95 disabled:opacity-50"
          >
            <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </header>

        {renderTab()}
      </div>
    </div>
  );
}
