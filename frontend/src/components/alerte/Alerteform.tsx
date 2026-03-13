import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { customersApi } from "@/services/customers.api";
import { X } from "lucide-react";
import "@/styles/sirene-form.css";

export interface AlerteFormData {
  name: string;
  customerIds: number[];
}

interface Props {
  initialData?: Partial<AlerteFormData> & { id?: number };
  onSubmit: (data: AlerteFormData) => Promise<void>;
  loading: boolean;
  error?: string;
}

export function AlerteForm({ initialData, onSubmit, loading, error }: Props) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();

  const [form, setForm] = useState<AlerteFormData>({
    name:        initialData?.name        ?? "",
    customerIds: initialData?.customerIds ?? [],
  });

  useEffect(() => {
    if (initialData?.id) {
      setForm({ name: initialData.name ?? "", customerIds: initialData.customerIds ?? [] });
    }
  }, [initialData?.id]);

  const { data: rawCustomers } = useQuery({ queryKey: ["customers"], queryFn: () => customersApi.getAll() });
  const customers = Array.isArray(rawCustomers) ? rawCustomers : (rawCustomers as any)?.response ?? [];

  function toggleCustomer(cid: number) {
    setForm(f => ({
      ...f,
      customerIds: f.customerIds.includes(cid)
        ? f.customerIds.filter(x => x !== cid)
        : [...f.customerIds, cid],
    }));
  }

  const selectedCustomers = customers.filter((c: any) => form.customerIds.includes(c.id));

  return (
    <div className="sirene-form-page">
      <div className="sirene-page-header">
        <button className="btn-back" onClick={() => navigate("/alertes")}>
          <ChevronLeft size={16} /> Retour à la liste
        </button>
        <h1 className="sirene-title">{isEdit ? "Modifier l'alerte" : "Nouvelle alerte"}</h1>
        <p className="sirene-subtitle">{isEdit ? "Modifiez les informations" : "Remplissez le formulaire"}</p>
      </div>

      <form onSubmit={async e => { e.preventDefault(); await onSubmit(form); }} className="sirene-form-layout">
        <div className="sirene-form-card">
          <div className="sirene-section-title">Informations</div>
          <div className="sirene-field">
            <label>Nom de l'alerte <span className="required">*</span></label>
            <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Ex: Alerte Inondation" autoFocus />
          </div>
        </div>

        <div className="sirene-form-card">
          <div className="sirene-section-title" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>Clients associés</span>
            {selectedCustomers.length > 0 && (
              <button type="button" className="btn-clear-all" onClick={() => setForm(f=>({...f,customerIds:[]}))}>
                <X size={12}/> Tout désélectionner
              </button>
            )}
          </div>
          {selectedCustomers.length > 0 && (
            <div className="selected-customers-tags">
              {selectedCustomers.map((c: any) => (
                <span key={c.id} className="customer-tag">
                  {c.name}
                  <button type="button" className="tag-remove" onClick={() => toggleCustomer(c.id)}><X size={11}/></button>
                </span>
              ))}
            </div>
          )}
          <div className="sirene-customers-grid">
            {customers.map((c: any) => (
              <label key={c.id} className={`sirene-customer-chip ${form.customerIds.includes(c.id) ? "checked" : ""}`}>
                <input type="checkbox" checked={form.customerIds.includes(c.id)} onChange={() => toggleCustomer(c.id)} />
                <span className="chip-dot"/>
                {c.name}
              </label>
            ))}
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="sirene-form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate("/alertes")}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={loading || !form.name.trim()}>
            {loading && <Loader2 size={14} className="spin"/>}
            {isEdit ? "Enregistrer" : "Créer l'alerte"}
          </button>
        </div>
      </form>
    </div>
  );
}