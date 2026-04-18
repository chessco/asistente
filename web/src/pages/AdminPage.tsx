import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { 
  Calendar, 
  Users, 
  Clock, 
  RefreshCcw, 
  Shield 
} from "lucide-react";

import API_BASE_URL from "../api-config";
import StatCards from "../components/admin/StatCards";
import AppointmentsList from "../components/admin/AppointmentsList";
import ConfigTab from "../components/admin/ConfigTab";
import ServicesTab from "../components/admin/ServicesTab";
import SuperAdminTab from "../components/admin/SuperAdminTab";

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
  const [activeTab, setActiveTab] = useState<"citas" | "config" | "services" | "super">("citas");
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
  const [googleClientEmail, setGoogleClientEmail] = useState("");
  const [googlePrivateKey, setGooglePrivateKey] = useState("");
  const [config, setConfig] = useState({ 
    start: "09:00", 
    end: "18:00", 
    days: [1, 2, 3, 4, 5] 
  });
  const [whatsapp, setWhatsapp] = useState('');
  const [isPremiumAI, setIsPremiumAI] = useState(false);
  const [cancelationBuffer, setCancelationBuffer] = useState(15);
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
      setConfig(data.businessHours || { start: "09:00", end: "18:00", days: [1, 2, 3, 4, 5] });
      setWhatsapp(data.whatsappNumber || '');
      setCalendarId(data.calendarId || 'primary');
      setGoogleClientEmail(data.googleClientEmail || '');
      setGooglePrivateKey(data.googlePrivateKey || '');
      setIsPremiumAI(data.isPremiumAI || false);
      setCancelationBuffer(data.cancelationBuffer || 15);
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
      const res = await fetch(`${API_BASE_URL}/api/${tenantId}/admin/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: businessName,
          calendarId: calendarId,
          businessHours: config, 
          whatsappNumber: whatsapp,
          googleClientEmail: googleClientEmail,
          googlePrivateKey: googlePrivateKey,
          isPremiumAI: isPremiumAI,
          cancelationBuffer: cancelationBuffer
        })
      });
      if (res.ok) {
        alert("Configuración guardada correctamente");
      } else {
        alert("Error al guardar la configuración");
      }
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

  const stats = [
    { label: "Citas Próximas", value: appointments.length, icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Pacientes Únicos", value: new Set(appointments.map(a => a.patient)).size, icon: Users, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Días Laborales", value: config.days.length, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" }
  ];

  return (
    <div className="min-h-screen bg-surface p-4 md:p-8 lg:p-12 pb-48 overflow-y-auto">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
              <Shield className="h-4 w-4" /> {businessName || tenantId}
            </div>
            <div className="flex gap-1 bg-surface-container-low p-1.5 rounded-3xl w-fit">
              {[
                { id: "citas", label: "Citas" },
                { id: "services", label: "Servicios" },
                { id: "config", label: "Horarios" },
                { id: "super", label: "Panel" }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-variant/50 hover:text-on-surface'}`}
                >
                  {tab.label}
                </button>
              ))}
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

        {activeTab === "citas" && (
          <div className="flex flex-col gap-8">
            <StatCards stats={stats} />
            <AppointmentsList 
               appointments={appointments} 
               loading={loading} 
               searchTerm={searchTerm} 
               setSearchTerm={setSearchTerm} 
               onRefresh={fetchAppointments}
            />
          </div>
        )}

        {activeTab === "config" && (
          <ConfigTab 
            businessName={businessName} setBusinessName={setBusinessName}
            calendarId={calendarId} setCalendarId={setCalendarId}
            whatsapp={whatsapp} setWhatsapp={setWhatsapp}
            config={config} setConfig={setConfig}
            googleClientEmail={googleClientEmail} setGoogleClientEmail={setGoogleClientEmail}
            googlePrivateKey={googlePrivateKey} setGooglePrivateKey={setGooglePrivateKey}
            isPremiumAI={isPremiumAI} setIsPremiumAI={setIsPremiumAI}
            cancelationBuffer={cancelationBuffer} setCancelationBuffer={setCancelationBuffer}
            onSave={saveConfig} saving={saving}
          />
        )}

        {activeTab === "services" && (
          <ServicesTab tenantId={tenantId} />
        )}

        {activeTab === "super" && (
          <SuperAdminTab 
            tenants={tenants}
            newTenant={newTenant} setNewTenant={setNewTenant}
            onCreateTenant={createTenant}
            editingTenantId={editingTenantId} setEditingTenantId={setEditingTenantId}
            tempName={tempName} setTempName={setTempName}
            onUpdateTenantName={updateTenantName}
          />
        )}
      </div>
    </div>
  );
}
