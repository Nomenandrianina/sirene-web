import { CheckCircle } from "lucide-react";
import type { ElementType } from "react";

type Props = {
  selected: boolean; onClick: () => void;
  title: string; subtitle?: string; icon?: ElementType;
};

export function OptionCard({ selected, onClick, title, subtitle, icon: Icon }: Props) {
  return (
    <button type="button" onClick={onClick}
      className={[
        "flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all w-full",
        selected
          ? "border-[#152a8a] bg-indigo-50"
          : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50",
      ].join(" ")}>
      {Icon && (
        <div className={[
          "w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center transition-all",
          selected ? "bg-indigo-100" : "bg-slate-100",
        ].join(" ")}>
          <Icon size={24} className={selected ? "text-[#152a8a]" : "text-slate-400"} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className="block font-semibold text-sm text-slate-800">{title}</span>
        {subtitle && <span className="block text-xs text-slate-500 mt-1">{subtitle}</span>}
      </div>
      {selected && <CheckCircle size={20} className="text-[#152a8a] flex-shrink-0" />}
    </button>
  );
}