import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { alerteTypesApi } from "@/services/alertetypes.api";
import { alertesApi } from "@/services/alertes.api";
import "@/styles/sirene-form.css";

export interface CategorieAlerteFormData { name: string; alerteId: number; alerteTypeId: number; }

interface Props {
  initialData?: Partial<CategorieAlerteFormData> & { id?: number };
  onSubmit: (data: CategorieAlerteFormData) => Promise<void>;
  loading: boolean; error?: string;
}

export function CategorieAlerteForm({ initialData, onSubmit, loading, error }: Props) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();
  const [form, setForm] = useState<CategorieAlerteFormData>({ name: initialData?.name??"", alerteId: initialData?.alerteId??0, alerteTypeId: initialData?.alerteTypeId??0 });

  useEffect(()=>{ if(initialData?.id) setForm({name:initialData.name??"",alerteId:initialData.alerteId??0,alerteTypeId:initialData.alerteTypeId??0}); },[initialData?.id]);

  const {data:rawAlertes}=useQuery({queryKey:["alertes"],queryFn:()=>alertesApi.getAll()});
  const {data:rawTypes}  =useQuery({queryKey:["alerte-types"],queryFn:()=>alerteTypesApi.getAll()});
  const alertes  = Array.isArray(rawAlertes)?rawAlertes:(rawAlertes as any)?.response??[];
  const allTypes = Array.isArray(rawTypes)?rawTypes:(rawTypes as any)?.response??[];
  const filteredTypes = useMemo(()=>form.alerteId?allTypes.filter((t:any)=>Number(t.alerteId)===form.alerteId):allTypes,[allTypes,form.alerteId]);

  return (
    <div className="sirene-form-page">
      <div className="sirene-page-header">
        <button className="btn-back" onClick={()=>navigate("/categorie-alertes")}><ChevronLeft size={16}/> Retour à la liste</button>
        <h1 className="sirene-title">{isEdit?"Modifier la catégorie":"Nouvelle catégorie d'alerte"}</h1>
        <p className="sirene-subtitle">{isEdit?"Modifiez les informations":"Remplissez le formulaire"}</p>
      </div>
      <form onSubmit={async e=>{e.preventDefault();await onSubmit(form);}} className="sirene-form-layout">
        <div className="sirene-form-card">
          <div className="sirene-section-title">Informations</div>
          <div className="sirene-fields-grid">
            <div className="sirene-field" style={{gridColumn:"1/-1"}}>
              <label>Nom de la catégorie <span className="required">*</span></label>
              <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ex: Crue soudaine" autoFocus/>
            </div>
          </div>
        </div>

        <div className="sirene-form-card">
          <div className="sirene-section-title">Hiérarchie</div>
          <div className="sirene-fields-grid">
            <div className="sirene-field">
              <label>Alerte <span className="required">*</span></label>
              <select required value={form.alerteId||""} onChange={e=>{const v=Number(e.target.value);setForm(f=>({...f,alerteId:v,alerteTypeId:0}));}}>
                <option value="">— Choisir une alerte —</option>
                {alertes.map((a:any)=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="sirene-field">
              <label>Type d'alerte <span className="required">*</span></label>
              <select required value={form.alerteTypeId||""} disabled={!form.alerteId} onChange={e=>setForm(f=>({...f,alerteTypeId:Number(e.target.value)}))}>
                <option value="">{!form.alerteId?"Choisir d'abord une alerte":"— Choisir un type —"}</option>
                {filteredTypes.map((t:any)=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error&&<div className="form-error">{error}</div>}
        <div className="sirene-form-actions">
          <button type="button" className="btn-cancel" onClick={()=>navigate("/categorie-alertes")}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={loading||!form.name.trim()||!form.alerteTypeId}>
            {loading&&<Loader2 size={14} className="spin"/>}
            {isEdit?"Enregistrer":"Créer la catégorie"}
          </button>
        </div>
      </form>
    </div>
  );
}