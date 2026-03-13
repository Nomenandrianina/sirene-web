import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
  import { Loader2, TriangleAlert } from "lucide-react";
  
  interface VillageDeleteDialogProps {
    open:      boolean;
    villageName: string;
    loading:   boolean;
    error?:    string;
    onConfirm: () => void;
    onCancel:  () => void;
  }
  
  export function VillageDeleteDialog({
    open, villageName, loading, error, onConfirm, onCancel,
  }: VillageDeleteDialogProps) {
    return (
      <AlertDialog open={open} onOpenChange={v => { if (!v) onCancel(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TriangleAlert size={18} className="text-red-500" />
              Supprimer le village
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer{" "}
              <strong className="text-foreground">« {villageName} »</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
  
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 mt-1">
              {error}
            </div>
          )}
  
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading} onClick={onCancel}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {loading && <Loader2 size={14} className="animate-spin mr-2" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }