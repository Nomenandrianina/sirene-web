import { useNavigate } from "react-router-dom";
import { AppLayout }   from "@/components/AppLayout";
import { Upload, Mic, ChevronLeft } from "lucide-react";

export default function AlerteAudioChooseMode() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">

        <div className="bg-white border-b border-slate-200 px-4 py-4">
          <button
            onClick={() => navigate("/alerte-audios")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition mb-3"
          >
            <ChevronLeft size={15} /> Retour à la liste
          </button>
          <h1 className="text-xl font-semibold text-slate-900">Nouvel audio d'alerte</h1>
          <p className="text-sm text-slate-500 mt-0.5">Choisissez comment créer l'audio</p>
        </div>

        <div className="max-w-xl mx-auto px-4 py-10 flex flex-col gap-4">

          {/* Upload */}
          <button
            onClick={() => navigate("/alerte-audios/create/upload")}
            className="group w-full text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-sky-400 hover:shadow-sm transition flex items-start gap-4"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition">
              <Upload size={18} className="text-sky-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 mb-0.5">Uploader un fichier</p>
              <p className="text-xs text-slate-500">
                Importez un fichier audio existant depuis votre appareil.<br />
                Formats acceptés : MP3, WAV, OGG, AAC, M4A, OPUS
              </p>
            </div>
          </button>

          {/* Enregistrement */}
          <button
            onClick={() => navigate("/alerte-audios/create/record")}
            className="group w-full text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-400 hover:shadow-sm transition flex items-start gap-4"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition">
              <Mic size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 mb-0.5">Enregistrer via micro</p>
              <p className="text-xs text-slate-500">
                Enregistrez directement depuis le navigateur.<br />
                Rééécoutez, recommencez si besoin, puis soumettez.
              </p>
            </div>
          </button>

          {/* Note HTTPS */}
          <p className="text-xs text-slate-400 text-center px-4">
            L'enregistrement micro requiert une connexion sécurisée (HTTPS) ou localhost.
          </p>

        </div>
      </div>
    </AppLayout>
  );
}