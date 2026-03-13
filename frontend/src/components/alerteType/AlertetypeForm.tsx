import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { alertesApi } from "@/services/alertes.api";
import "@/styles/sirene-form.css";

export interface AlerteTypeFormData { name: string; alerteId: number; }

interface Props {
  initialData?: Partial<AlerteTypeFormData> & { id?: number };
  onSubmit: (data: AlerteTypeFormData) => Promise<void>;
  loading: boolean; error?: string;
}

export function AlerteTypeForm({ initialData, onSubmit, loading, error }: Props) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();
  const [form, setForm] = useState<AlerteTypeFormData>({ name: initialData?.name??"", alerteId: initialData?.alerteId??0 });

  useEffect(() => {
    if (initialData?.id) setForm({ name: initialData.name??"", alerteId: initialData.alerteId??0 });
  }, [initialData?.id]);

  const { data: raw } = useQuery({ queryKey:["alertes"], queryFn:()=>alertesApi.getAll() });
  const alertes = Array.isArray(raw) ? raw : (raw as any)?.response ?? [];

  return (
    <div className="sirene-form-page">
      <div className="sirene-page-header">
        <button className="btn-back" onClick={()=>navigate("/alerte-types")}><ChevronLeft size={16}/> Retour à la liste</button>
        <h1 className="sirene-title">{isEdit?"Modifier le type":"Nouveau type d'alerte"}</h1>
        <p className="sirene-subtitle">{isEdit?"Modifiez les informations":"Remplissez le formulaire"}</p>
      </div>

      <form onSubmit={async e=>{e.preventDefault();await onSubmit(form);}} className="sirene-form-layout">
        <div className="sirene-form-card">
          <div className="sirene-section-title">Informations</div>
          <div className="sirene-fields-grid">
            <div className="sirene-field">
              <label>Nom du type <span className="required">*</span></label>
              <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ex: Alerte Rouge" autoFocus/>
            </div>
            <div className="sirene-field">
              <label>Alerte parente <span className="required">*</span></label>
              <select required value={form.alerteId||""} onChange={e=>setForm(f=>({...f,alerteId:Number(e.target.value)}))}>
                <option value="">— Choisir une alerte —</option>
                {alertes.map((a:any)=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}
        <div className="sirene-form-actions">
          <button type="button" className="btn-cancel" onClick={()=>navigate("/alerte-types")}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={loading||!form.name.trim()||!form.alerteId}>
            {loading&&<Loader2 size={14} className="spin"/>}
            {isEdit?"Enregistrer":"Créer le type"}
          </button>
        </div>
      </form>
    </div>
  );
}