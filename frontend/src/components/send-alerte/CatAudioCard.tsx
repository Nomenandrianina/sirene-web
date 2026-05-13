import { CheckCircle } from "lucide-react";
import { audioAlerteBngrcApi } from "@/services/audioAlerteBngrc.api";
import { getScheme } from "@/utils/send-alerte/colorHelpers";
import { getTypeEmoji } from "@/utils/send-alerte/typeHelpers";
import { MiniPlayer } from "./MiniPlayer";

type Props = {
  categorie: any; audio: any;
  selected: boolean; onClick: () => void; typeName: string;
};

export function CatAudioCard({ categorie, audio, selected, onClick, typeName }: Props) {
  const hasAudio = !!audio;
  const s        = getScheme(categorie);
  const icon     = getTypeEmoji(typeName);

  return (
    <div onClick={() => hasAudio && onClick()}
      className={[
        "rounded-xl border-2 p-5 flex flex-col gap-3 transition-all duration-150",
        selected ? `${s.cardSelected} ${s.borderSelected}` : `${s.card} ${s.border}`,
        hasAudio ? "cursor-pointer hover:brightness-95" : "opacity-45 cursor-not-allowed",
      ].join(" ")}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl ${s.iconBg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <span className={`text-sm font-semibold leading-snug ${s.text}`}>{categorie.name}</span>
          {hasAudio
            ? <span className={`text-xs truncate ${s.text} opacity-70`}>{audio.name || audio.originalFilename}</span>
            : <span className="text-xs italic text-slate-400">Aucun audio approuvé associé</span>}
        </div>
        {selected && <CheckCircle size={22} className={`flex-shrink-0 ${s.checkColor}`} />}
      </div>
      {hasAudio && selected && (
        <MiniPlayer url={audioAlerteBngrcApi.audioUrl(audio.audio)} playerBg={s.playerBg} />
      )}
    </div>
  );
}