import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { alertesApi }   from "@/services/alertes.api";
import { customersApi } from "@/services/customers.api";
import { useAuth }      from "@/contexts/AuthContext";
import "@/styles/sirene-form.css";

export interface AlerteTypeFormData {
  name:        string;
  alerteId:    number;
  customerIds: number[];
}

interface Props {
  initialData?: Partial<AlerteTypeFormData> & { id?: number };
  onSubmit: (data: AlerteTypeFormData) => Promise<void>;
  loading: boolean;
  error?:  string;
}

export function AlerteTypeForm({ initialData, onSubmit, loading, error }: Props) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  const [form, setForm] = useState<AlerteTypeFormData>({
    name:        initialData?.name        ?? "",
    alerteId:    initialData?.alerteId    ?? 0,
    customerIds: initialData?.customerIds ?? [],
  });

  useEffect(() => {
    if (initialData?.id) {
      setForm({
        name:        initialData.name        ?? "",
        alerteId:    initialData.alerteId    ?? 0,
        customerIds: initialData.customerIds ?? [],
      });
    }
  }, [initialData?.id]);

  const { data: rawAlertes }   = useQuery({ queryKey: ["alertes"],   queryFn: () => alertesApi.getAll() });
  const { data: rawCustomers } = useQuery({ queryKey: ["customers"], queryFn: () => customersApi.getAll(), enabled: isSuperAdmin });

  const alertes   = Array.isArray(rawAlertes)   ? rawAlertes   : (rawAlertes   as any)?.response ?? [];
  const customers = Array.isArray(rawCustomers) ? rawCustomers : (rawCustomers as any)?.response ?? [];

  function toggleCustomer(id: number) {
    setForm(f => ({
      ...f,
      customerIds: f.customerIds.includes(id)
        ? f.customerIds.filter(c => c !== id)
        : [...f.customerIds, id],
    }));
  }

  return (
    <div className="sirene-form-page">
      <div className="sirene-page-header">
        <button className="btn-back" onClick={() => navigate("/alerte-types")}>
          <ChevronLeft size={16} /> Retour à la liste
        </button>
        <h1 className="sirene-title">{isEdit ? "Modifier le type" : "Nouveau type d'alerte"}</h1>
        <p className="sirene-subtitle">{isEdit ? "Modifiez les informations" : "Remplissez le formulaire"}</p>
      </div>

      <form onSubmit={async e => { e.preventDefault(); await onSubmit(form); }} className="sirene-form-layout">

        {/* Informations */}
        <div className="sirene-form-card">
          <div className="sirene-section-title">Informations</div>
          <div className="sirene-fields-grid">
            <div className="sirene-field">
              <label>Nom du type <span className="required">*</span></label>
              <input required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Cyclone" autoFocus />
            </div>
            <div className="sirene-field">
              <label>Alerte parente <span className="required">*</span></label>
              <select required value={form.alerteId || ""}
                onChange={e => setForm(f => ({ ...f, alerteId: Number(e.target.value) }))}>
                <option value="">— Choisir une alerte —</option>
                {alertes.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Clients assignés — visible superadmin uniquement */}
        {isSuperAdmin && (
          <div className="sirene-form-card">
            <div className="sirene-section-title">Clients assignés</div>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 12 }}>
              Si aucun client n'est sélectionné, ce type sera visible uniquement par le superadmin.
              Assignez des clients pour leur donner accès à ce type lors de l'envoi d'alerte.
            </p>
            {customers.length === 0 ? (
              <p style={{ fontSize: "0.82rem", color: "#94a3b8" }}>Aucun client disponible</p>
            ) : (
              <div className="sirene-customers-chips">
                {customers.map((c: any) => {
                  const selected = form.customerIds.includes(c.id);
                  return (
                    <button key={c.id} type="button"
                      className={`customer-chip${selected ? " selected" : ""}`}
                      onClick={() => toggleCustomer(c.id)}>
                      {c.name}
                      {selected && <span className="chip-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {form.customerIds.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div className="selected-customers-tags">
                  {form.customerIds.map(id => {
                    const c = customers.find((x: any) => x.id === id);
                    return c ? (
                      <span key={id} className="customer-tag">
                        {c.name}
                        <button type="button" onClick={() => toggleCustomer(id)}>✕</button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {error && <div className="form-error">{error}</div>}
        <div className="sirene-form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate("/alerte-types")}>Annuler</button>
          <button type="submit" className="btn-primary"
            disabled={loading || !form.name.trim() || !form.alerteId}>
            {loading && <Loader2 size={14} className="spin" />}
            {isEdit ? "Enregistrer" : "Créer le type"}
          </button>
        </div>
      </form>
    </div>
  );
}