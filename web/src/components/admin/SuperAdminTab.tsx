import { motion } from "motion/react";
import { Plus, Database, Check, X, Pencil, ArrowLeftRight } from "lucide-react";

interface Props {
  tenants: any[];
  newTenant: any;
  setNewTenant: (val: any) => void;
  onCreateTenant: () => void;
  editingTenantId: string | null;
  setEditingTenantId: (val: string | null) => void;
  tempName: string;
  setTempName: (val: string) => void;
  onUpdateTenantName: (id: string) => void;
}

export default function SuperAdminTab({
  tenants, newTenant, setNewTenant, onCreateTenant,
  editingTenantId, setEditingTenantId,
  tempName, setTempName, onUpdateTenantName
}: Props) {
  return (
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
              onClick={onCreateTenant}
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
                        onClick={() => onUpdateTenantName(t.id)}
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
}
