import { AlertDialog, AlertDialogAction, AlertDialogCancel,AlertDialogContent, AlertDialogDescription,AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,} from "@/components/ui/alert-dialog";
  import { Loader2, TriangleAlert } from "lucide-react";
  
  interface Props {
    open:     boolean;
    label:    string;
    itemName: string;
    loading:  boolean;
    error?:   string;
    onConfirm: () => void;
    onCancel:  () => void;
  }
  
  export function AlerteDeleteDialog({ open, label, itemName, loading, error, onConfirm, onCancel }: Props) {
    return (
      <AlertDialog open={open} onOpenChange={v => { if (!v) onCancel(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TriangleAlert size={18} className="text-red-500" />
              Supprimer {label}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong className="text-foreground">« {itemName} »</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626", borderRadius:8, padding:"10px 14px", fontSize:"0.83rem", display:"flex", alignItems:"center", gap:8 }}>
              <TriangleAlert size={14} />{error}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading} onClick={onCancel}>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={loading} onClick={onConfirm} style={{ background:"#dc2626" }}>
              {loading ? <><Loader2 size={14} className="animate-spin" style={{marginRight:6}}/>Suppression…</> : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }