import { CreditCard } from 'lucide-react';

interface CreditBadgeProps {
  restants: number | null;
  total: number | null;
}

export function CreditBadge({ restants, total }: CreditBadgeProps) {
  if (restants === null) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200">
        <CreditCard size={12} className="text-violet-500" />
        <span className="text-xs font-semibold text-violet-700">Illimité</span>
      </div>
    );
  }

  const pct = total ? Math.round((restants / total) * 100) : 0;
  const isLow = pct <= 20;
  const isEmpty = restants === 0;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border
      ${isEmpty ? 'bg-red-50 border-red-200' : isLow ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
      <CreditCard size={12} className={isEmpty ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-emerald-500'} />
      <span className={`text-xs font-semibold ${isEmpty ? 'text-red-700' : isLow ? 'text-amber-700' : 'text-emerald-700'}`}>
        {restants} crédit{restants > 1 ? 's' : ''}{total ? ` / ${total}` : ''}
      </span>
    </div>
  );
}