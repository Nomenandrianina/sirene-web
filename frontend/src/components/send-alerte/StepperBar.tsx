import { CheckCircle } from "lucide-react";
import { STEPS } from "@/utils/send-alerte/constants";

export function StepperBar({ step }: { step: number }) {
  return (
    <div className="flex items-center w-full">
      {STEPS.map((s, i) => {
        const done = i < step, active = i === step;
        return (
          <div key={s.id} className="flex items-center flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className={[
                "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all",
                done   ? "border-green-500 bg-green-500 text-white"          : "",
                active ? "border-[#152a8a] bg-[#152a8a] text-white"          : "",
                !done && !active ? "border-slate-200 bg-white text-slate-400": "",
              ].join(" ")}>
                {done ? <CheckCircle size={15} /> : <span>{i + 1}</span>}
              </div>
              <span className={[
                "text-[0.8rem] font-semibold whitespace-nowrap transition-colors",
                active ? "text-[#152a8a]" : done ? "text-green-500" : "text-slate-400",
              ].join(" ")}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 mx-4 flex-1 transition-colors ${done ? "bg-green-500" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}