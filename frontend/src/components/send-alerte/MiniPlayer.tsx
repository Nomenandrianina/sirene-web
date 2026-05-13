import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

export function MiniPlayer({ url, playerBg }: { url: string; playerBg: string }) {
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = new Audio(url);
    audioRef.current = a;
    a.addEventListener("timeupdate",     () => setProgress(a.currentTime));
    a.addEventListener("loadedmetadata", () => setDuration(a.duration));
    a.addEventListener("ended",          () => setPlaying(false));
    return () => { a.pause(); a.src = ""; };
  }, [url]);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a) return;
    playing ? (a.pause(), setPlaying(false)) : (a.play(), setPlaying(true));
  }

  function fmt(s: number) {
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  }

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 mt-3 ${playerBg}`}
      onClick={e => e.stopPropagation()}>
      <button onClick={toggle}
        className="w-7 h-7 rounded-full bg-white/80 border border-white/60 flex items-center justify-center flex-shrink-0 hover:bg-white transition">
        {playing ? <Pause size={12} /> : <Play size={12} />}
      </button>
      <input type="range" min={0} max={duration || 1} step={1} value={progress}
        className="flex-1 h-1 accent-current"
        onChange={e => {
          if (audioRef.current) audioRef.current.currentTime = +e.target.value;
          setProgress(+e.target.value);
        }} />
      <span className="text-[11px] opacity-70 whitespace-nowrap font-mono">
        {fmt(progress)} / {fmt(duration)}
      </span>
    </div>
  );
}