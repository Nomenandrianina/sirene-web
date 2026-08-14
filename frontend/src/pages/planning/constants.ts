export const STATUS_CFG = {
    planned:   { label: 'Planifié', color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-200',  dot: 'bg-blue-400'  },
    sent:      { label: 'Envoyé',   color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-400' },
    cancelled: { label: 'Annulé',   color: 'text-red-500',   bg: 'bg-red-50',   border: 'border-red-200',   dot: 'bg-red-400'   },
    skipped:   { label: 'Ignoré',   color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-300' },
  } as const;