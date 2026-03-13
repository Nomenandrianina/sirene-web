import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { alerteAudiosApi } from "@/services/alerteaudio.api";
import {  AlerteAudio } from "@/types/alerteAudio";
import { AlerteDeleteDialog } from "@/components/alerte/Alertedeletedialog";
import {
  Search, Plus, Pencil, Trash2, Loader2,
  ChevronLeft, ChevronRight, Music, Play, Pause, Download,
} from "lucide-react";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";
import "@/styles/alerte-audio.css";
import { CanDo } from "@/components/Cando";

const PER_PAGE = 10;

function MiniPlayer({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.addEventListener("ended", () => setPlaying(false));
    }
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else         { audioRef.current.play();  setPlaying(true);  }
  }

  return (
    <button className="mini-player-btn" onClick={toggle} title={playing ? "Pause" : "Écouter"}>
      {playing ? <Pause size={13}/> : <Play size={13}/>}
      {playing ? "Pause" : "Écouter"}
    </button>
  );
}

function fmt(s?: number) {
  if (!s) return "—";
  const m = Math.floor(s/60), sec = Math.floor(s%60);
  return `${m}:${sec.toString().padStart(2,"0")}`;
}

function fmtSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(0)} Ko`;
  return `${(bytes/1024/1024).toFixed(1)} Mo`;
}

export default function AlerteAudioList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);
  const [delItem, setDelItem]   = useState<{id:number;name:string}|null>(null);
  const [delError, setDelError] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["alerte-audios"],
    queryFn:  () => alerteAudiosApi.getAll(),
  });
  const items: AlerteAudio[] = Array.isArray(raw) ? raw : (raw as any)?.response ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(a =>
      (a.name||"").toLowerCase().includes(q) ||
      a.mobileId.toLowerCase().includes(q) ||
      (a.sousCategorie?.name||"").toLowerCase().includes(q)
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const deleteMut = useMutation({
    mutationFn: (id: number) => alerteAudiosApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:["alerte-audios"]}); setDelError(""); setTimeout(()=>setDelItem(null),300); },
    onError: (e: any) => setDelError(e?.response?.data?.message || e?.message || "Erreur suppression"),
  });

  function handleDownload(audio: AlerteAudio) {
    const url  = alerteAudiosApi.audioUrl(audio.audio);
    const link = document.createElement("a");
    link.href     = url;
    link.download = audio.originalFilename ?? audio.name ?? `audio-${audio.id}`;
    link.click();
  }

  return (
    <AppLayout>
      <div className="page-wrap">
        <div className="page-header">
          <div>
            <h1 className="page-title">Audios d'alerte</h1>
            <p className="page-subtitle">{items.length} audio{items.length>1?"s":""} enregistré{items.length>1?"s":""}</p>
          </div>
          <CanDo permission="alerte-audios:create">
            <button className="btn-primary" onClick={()=>navigate("/alerte-audios/create")}>
              <Plus size={15}/> Nouvel audio
            </button>
          </CanDo>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Liste des audios</span>
            <div className="search-wrap">
              <Search size={14} className="search-icon"/>
              <input className="search-input" placeholder="Nom, mobile ID, sous-catégorie…"
                value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
            </div>
          </div>

          <div style={{overflowX:"auto"}}>
            {isLoading ? (
              <div className="empty-state"><Loader2 size={24} className="spin"/><p>Chargement…</p></div>
            ) : paginated.length === 0 ? (
              <div className="empty-state"><Music size={28}/><p>Aucun audio trouvé</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Audio</th>
                    <th>Mobile ID</th>
                    <th>Sous-catégorie</th>
                    <th>Durée</th>
                    <th>Taille</th>
                    <th>Écoute</th>
                    <th style={{textAlign:"right"}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div className="user-cell">
                          <div className="role-avatar"><Music size={14}/></div>
                          <div>
                            <span className="user-cell-name">{a.name || a.originalFilename || `Audio #${a.id}`}</span>
                            {a.description && <p style={{fontSize:"0.73rem",color:"var(--p-text-3)",margin:0}}>{a.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td><span className="cell-imei">{a.mobileId}</span></td>
                      <td>{a.sousCategorie ? <span className="perm-tag">{a.sousCategorie.name}</span> : <span style={{color:"var(--p-text-3)"}}>—</span>}</td>
                      <td><span style={{fontSize:"0.82rem"}}>{fmt(a.duration)}</span></td>
                      <td><span style={{fontSize:"0.82rem"}}>{fmtSize(a.fileSize)}</span></td>
                      <td><MiniPlayer url={alerteAudiosApi.audioUrl(a.audio)}/></td>
                      <td>
                        <div className="action-btns">
                          <button className="action-btn" title="Télécharger" onClick={()=>handleDownload(a)}
                            style={{color:"#0891b2",border:"1px solid #cffafe",background:"#ecfeff"}}>
                            <Download size={14}/>
                          </button>
                          <CanDo permission="alerte-audios:update">
                            <button className="action-btn edit" title="Modifier" onClick={()=>navigate(`/alerte-audios/${a.id}/edit`)}>
                              <Pencil size={14}/>
                            </button>
                          </CanDo>
                          <CanDo permission="alerte-audios:delete">
                            <button className="action-btn delete" title="Supprimer"
                              onClick={()=>{setDelError("");setDelItem({id:a.id,name:a.name||a.originalFilename||`Audio #${a.id}`});}}>
                              <Trash2 size={14}/>
                            </button>
                          </CanDo>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!isLoading && filtered.length > PER_PAGE && (
            <div className="pagination">
              <span className="pagination-info">{(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,filtered.length)} sur {filtered.length}</span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={15}/></button>
                {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1)
                  .reduce<(number|"...")[]>((acc,p,i,arr)=>{if(i>0&&p-(arr[i-1] as number)>1)acc.push("...");acc.push(p);return acc;},[])
                  .map((p,i)=>p==="..."?<span key={`d${i}`} className="page-dots">…</span>:<button key={p} className={`page-btn${page===p?" active":""}`} onClick={()=>setPage(p as number)}>{p}</button>)}
                <button className="page-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}><ChevronRight size={15}/></button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlerteDeleteDialog open={!!delItem} label="l'audio" itemName={delItem?.name??""} loading={deleteMut.isPending} error={delError}
        onConfirm={()=>delItem&&deleteMut.mutate(delItem.id)}
        onCancel={()=>{setDelItem(null);setDelError("");deleteMut.reset();}}
      />
    </AppLayout>
  );
}