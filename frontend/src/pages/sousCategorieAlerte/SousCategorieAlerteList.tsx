import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { sousCategorieAlertesApi } from "@/services/souscategorieAlerte.api";
import { AlerteDeleteDialog } from "@/components/alerte/Alertedeletedialog";
import { Search, Plus, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";

const PER_PAGE = 10;

export default function SousCategorieAlerteList() {
  const navigate=useNavigate(); const qc=useQueryClient();
  const [search,setSearch]=useState(""); const [page,setPage]=useState(1);
  const [delItem,setDelItem]=useState<{id:number;name:string}|null>(null);
  const [delError,setDelError]=useState("");

  const {data:raw,isLoading}=useQuery({queryKey:["sous-categorie-alertes"],queryFn:()=>sousCategorieAlertesApi.getAll()});
  const items=Array.isArray(raw)?raw:(raw as any)?.response??[];

  const filtered=useMemo(()=>{const q=search.toLowerCase();return items.filter((a:any)=>(a.name||"").toLowerCase().includes(q)||(a.categorieAlerte?.name||"").toLowerCase().includes(q));},[items,search]);
  const totalPages=Math.max(1,Math.ceil(filtered.length/PER_PAGE));
  const paginated=filtered.slice((page-1)*PER_PAGE,page*PER_PAGE);

  const deleteMut=useMutation({
    mutationFn:(id:number)=>sousCategorieAlertesApi.remove(id),
    onSuccess:()=>{qc.invalidateQueries({queryKey:["sous-categorie-alertes"]});setDelError("");setTimeout(()=>setDelItem(null),300);},
    onError:(e:any)=>setDelError(e?.response?.data?.message||e?.message||"Erreur suppression"),
  });

  return (
    <AppLayout>
      <div className="page-wrap">
        <div className="page-header">
          <div><h1 className="page-title">Sous-catégories d'alerte</h1><p className="page-subtitle">{items.length} sous-catégorie{items.length>1?"s":""}</p></div>
          <button className="btn-primary" onClick={()=>navigate("/sous-categorie-alertes/create")}><Plus size={15}/> Nouvelle sous-catégorie</button>
        </div>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Liste des sous-catégories</span>
            <div className="search-wrap"><Search size={14} className="search-icon"/><input className="search-input" placeholder="Nom, catégorie…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></div>
          </div>
          <div style={{overflowX:"auto"}}>
            {isLoading?(<div className="empty-state"><Loader2 size={24} className="spin"/><p>Chargement…</p></div>)
            :paginated.length===0?(<div className="empty-state"><Layers size={28}/><p>Aucune sous-catégorie trouvée</p></div>)
            :(
              <table className="data-table">
                <thead><tr><th>Nom</th><th>Alerte</th><th>Type</th><th>Catégorie</th><th>Audios</th><th style={{textAlign:"right"}}>Actions</th></tr></thead>
                <tbody>
                  {paginated.map((a:any)=>(
                    <tr key={a.id}>
                      <td><div className="user-cell"><div className="role-avatar"><Layers size={14}/></div><span className="user-cell-name">{a.name}</span></div></td>
                      <td>{a.alerte?<span className="perm-tag">{a.alerte.name}</span>:<span style={{color:"var(--p-text-3)"}}>—</span>}</td>
                      <td>{a.alerteType?<span className="perm-tag">{a.alerteType.name}</span>:<span style={{color:"var(--p-text-3)"}}>—</span>}</td>
                      <td>{a.categorieAlerte?<span className="perm-tag">{a.categorieAlerte.name}</span>:<span style={{color:"var(--p-text-3)"}}>—</span>}</td>
                      <td><span className="perm-tag">{a.audios?.length??0} audio{(a.audios?.length??0)>1?"s":""}</span></td>
                      <td><div className="action-btns">
                        <button className="action-btn edit" onClick={()=>navigate(`/sous-categorie-alertes/${a.id}/edit`)}><Pencil size={14}/></button>
                        <button className="action-btn delete" onClick={()=>{setDelError("");setDelItem({id:a.id,name:a.name});}}><Trash2 size={14}/></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {!isLoading&&filtered.length>PER_PAGE&&(
            <div className="pagination">
              <span className="pagination-info">{(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,filtered.length)} sur {filtered.length}</span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={15}/></button>
                {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1).reduce<(number|"...")[]>((acc,p,i,arr)=>{if(i>0&&p-(arr[i-1] as number)>1)acc.push("...");acc.push(p);return acc;},[]).map((p,i)=>p==="..."?<span key={`d${i}`} className="page-dots">…</span>:<button key={p} className={`page-btn${page===p?" active":""}`} onClick={()=>setPage(p as number)}>{p}</button>)}
                <button className="page-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}><ChevronRight size={15}/></button>
              </div>
            </div>
          )}
        </div>
      </div>
      <AlerteDeleteDialog open={!!delItem} label="la sous-catégorie" itemName={delItem?.name??""} loading={deleteMut.isPending} error={delError}
        onConfirm={()=>delItem&&deleteMut.mutate(delItem.id)} onCancel={()=>{setDelItem(null);setDelError("");deleteMut.reset();}}/>
    </AppLayout>
  );
}