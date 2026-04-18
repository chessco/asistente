import React, { useState, useEffect } from "react";
import { Plus, Trash2, Briefcase } from "lucide-react";
import { motion } from "motion/react";
import API_BASE_URL from "../../api-config";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number | null;
}

interface Props {
  tenantId: string;
}

export default function ServicesTab({ tenantId }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({ name: '', duration: 60, price: '' });
  const [adding, setAdding] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/${tenantId}/admin/services`);
      const data = await res.json();
      setServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const addService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name) return;
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/${tenantId}/admin/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newService,
          price: newService.price ? parseFloat(newService.price) : null
        })
      });
      if (res.ok) {
        setNewService({ name: '', duration: 60, price: '' });
        fetchServices();
      }
    } catch (error) {
      console.error("Error adding service:", error);
    } finally {
      setAdding(false);
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar este servicio?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/${tenantId}/admin/services/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [tenantId]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="premium-card rounded-[2rem] p-8 bg-white/40 backdrop-blur-md shadow-2xl border border-white/40">
        <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
          <Briefcase className="text-primary" /> Gestión de Servicios
        </h2>

        <form onSubmit={addService} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 items-end">
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Nombre del Servicio</label>
            <input 
              type="text" 
              placeholder="Ej: Limpieza Dental"
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              className="w-full rounded-2xl border-none bg-white p-4 font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Duración (min)</label>
            <input 
              type="number" 
              value={newService.duration}
              onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) })}
              className="w-full rounded-2xl border-none bg-white p-4 font-bold shadow-inner focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={adding}
            className="bg-primary text-on-primary rounded-2xl h-[56px] font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <Plus className="h-5 w-5" /> Agregar
          </button>
        </form>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center p-12 text-on-surface-variant/40 font-bold">
              Aún no hay servicios registrados.
            </div>
          ) : (
            services.map((service) => (
              <div 
                key={service.id}
                className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-black/5 hover:border-primary/20 transition-all"
              >
                <div>
                  <h3 className="font-black text-lg">{service.name}</h3>
                  <div className="flex gap-4 text-sm text-on-surface-variant font-bold">
                    <span>{service.duration} minutos</span>
                    {service.price && <span>${service.price}</span>}
                  </div>
                </div>
                <button 
                  onClick={() => deleteService(service.id)}
                  className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
