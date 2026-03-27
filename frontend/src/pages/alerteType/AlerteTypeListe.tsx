import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { alerteTypesApi } from "@/services/alertetypes.api";
import { AlerteDeleteDialog } from "@/components/alerte/Alertedeletedialog";
import { Search, Plus, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, Tag ,Building2} from "lucide-react";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";
import { CanDo } from "@/components/Cando";
import { useAuth } from "@/contexts/AuthContext";

const PER_PAGE = 10;

export default function AlerteTypeList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search,setSearch]=useState(""); const [page,setPage]=useState(1);
  const [delItem,setDelItem]=useState<{id:number;name:string}|null>(null);
  const [delError,setDelError]=useState("");
  const { isSuperAdmin } = useAuth();

  const { data:raw, isLoading } = useQuery({ queryKey:["alerte-types"], queryFn:()=>alerteTypesApi.getAll() });
  const items = Array.isArray(raw)?raw:(raw as any)?.response??[];

  const filtered = useMemo(()=>{const q=search.toLowerCase();return items.filter((a:any)=>a.name?.toLowerCase().includes(q)||(a.alerte?.name||"").toLowerCase().includes(q));},[items,search]);
  const totalPages=Math.max(1,Math.ceil(filtered.length/PER_PAGE));
  const paginated=filtered.slice((page-1)*PER_PAGE,page*PER_PAGE);

  const deleteMut = useMutation({
    mutationFn:(id:number)=>alerteTypesApi.remove(id),
    onSuccess:()=>{qc.invalidateQueries({queryKey:["alerte-types"]});setDelError("");setTimeout(()=>setDelItem(null),300);},
    onError:(e:any)=>setDelError(e?.response?.data?.message||e?.message||"Erreur suppression"),
  });

  return (
    <AppLayout>
      <div className="page-wrap">
        <div className="page-header">
          <div><h1 className="text-xl font-semibold text-slate-900">Types d'alerte</h1><p className="page-subtitle">{items.length} type{items.length>1?"s":""}</p></div>
          <CanDo permission="alerte-types:create">
            <button className="btn-primary" onClick={()=>navigate("/alerte-types/create")}><Plus size={15}/> Nouveau type</button>
          </CanDo>
        </div>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Liste des types d'alerte</span>
            <div className="search-wrap"><Search size={14} className="search-icon"/><input className="search-input" placeholder="Nom, alerte parente…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></div>
          </div>
          <div style={{overflowX:"auto"}}>
            {isLoading?(<div className="empty-state"><Loader2 size={24} className="spin"/><p>Chargement…</p></div>)
            :paginated.length===0?(<div className="empty-state"><Tag size={28}/><p>Aucun type trouvé</p></div>)
            :(
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Alerte parente</th>
                    <th>Catégories</th>
                    <th>Catégories</th>
                    {isSuperAdmin && <th>Clients assignés</th>}

                    <th style={{textAlign:"right"}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((a:any)=>(
                    <tr key={a.id}>
                      <td><div className="user-cell"><div className="role-avatar"><Tag size={14}/></div><span className="user-cell-name">{a.name}</span></div></td>
                      <td>{a.alerte?<span className="perm-tag">{a.alerte.name}</span>:<span style={{color:"var(--p-text-3)"}}>—</span>}</td>
                      <td><span className="perm-tag">{a.categories?.length??0} catégorie{(a.categories?.length??0)>1?"s":""}</span></td>
                      {isSuperAdmin && (
                        <td>
                          {a.customers?.length > 0 ? (
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {a.customers.slice(0, 3).map((c: any) => (
                                <span key={c.id} className="perm-tag" style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" }}>
                                  <Building2 size={10} style={{ marginRight: 3 }} />{c.name}
                                </span>
                              ))}
                              {a.customers.length > 3 && <span className="perm-tag">+{a.customers.length - 3}</span>}
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Aucun client</span>
                          )}
                        </td>
                      )}
                      <td><div className="action-btns">
                        <CanDo permission="alerte-types:update">
                          <button className="action-btn edit" onClick={()=>navigate(`/alerte-types/${a.id}/edit`)}><Pencil size={14}/></button>
                        </CanDo>
                        <CanDo permission="alerte-types:delete">
                          <button className="action-btn delete" onClick={()=>{setDelError("");setDelItem({id:a.id,name:a.name});}}><Trash2 size={14}/></button>
                        </CanDo>
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
      <AlerteDeleteDialog open={!!delItem} label="le type" itemName={delItem?.name??""} loading={deleteMut.isPending} error={delError}
        onConfirm={()=>delItem&&deleteMut.mutate(delItem.id)} onCancel={()=>{setDelItem(null);setDelError("");deleteMut.reset();}}/>
    </AppLayout>
  );
}