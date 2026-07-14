import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { diffusionPlanifieeApi, type ClientPlanningResponse, type ClientPlanningSlot, type ClientAddDiffusionDto,type AudioDisponible} from '@/services/diffusionplanniee.api';

export function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function getMondayOf(d: Date): Date {
  const day  = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon;
}

export function fmtDate(iso: string): string {
  const MOIS = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate()} ${MOIS[d.getMonth()]}`;
}

export function fmtHeure(heure: number, minute: number): string {
  return `${String(heure).padStart(2, '0')}h${String(minute).padStart(2, '0')}`;
}

export const JOURS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export type { ClientPlanningSlot, ClientPlanningResponse ,AudioDisponible};

export interface UsePlanningClientParams {
  customerId:     number;
  souscriptionId: number;
  sireneId:       number; // conservé dans le type mais ignoré si 0
  enabled:        boolean;
}

export function usePlanningClient(params: UsePlanningClientParams) {
  const qc = useQueryClient();

  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()));
  const weekEnd = addDays(weekStart, 6);
  const from    = toISO(weekStart);
  const to      = toISO(weekEnd);

  // ── FIX 1 : sireneId retiré du queryKey ──────────────────────────────────
  const queryKey = [
    'client-planning',
    params.souscriptionId,
    params.sireneId,
    from,
    to,
  ] as const;


  const { data, isLoading, error } = useQuery<ClientPlanningResponse>({
    queryKey,
    queryFn: () =>
      diffusionPlanifieeApi.getClientPlanning({
        customerId:     params.customerId,
        souscriptionId: params.souscriptionId,
        sireneId: params.sireneId,
        from,
        to,
        // sireneId omis → backend retourne toutes les sirènes de la souscription
      }),
    // ── FIX 3 : plus de condition sireneId > 0 qui bloquait la query
    // enabled: params.enabled && params.souscriptionId > 0,
    enabled: params.enabled && params.souscriptionId > 0 && params.sireneId > 0,
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: (dto: ClientAddDiffusionDto) =>
      diffusionPlanifieeApi.clientAdd(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...queryKey] }),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, userId }: { id: number; userId: number }) =>
      diffusionPlanifieeApi.cancel(id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...queryKey] }),
  });

  const prevWeek        = useCallback(() => setWeekStart(d => addDays(d, -7)), []);
  const nextWeek        = useCallback(() => setWeekStart(d => addDays(d, +7)), []);
  const goToCurrentWeek = useCallback(() => setWeekStart(getMondayOf(new Date())), []);
  const isCurrentWeek   = toISO(getMondayOf(new Date())) === from;

  const getSlot = useCallback(
    (date: string, heure: number): ClientPlanningSlot | null =>
      data?.slots.find(s => s.date === date && s.heure === heure) ?? null,
    [data],
  );

  return {
    data,
    slots:           data?.slots             ?? [],
    audios:          data?.audiosDisponibles ?? [],
    creneaux:        data?.creneaux          ?? [],
    creditsRestants: data?.creditsRestants   ?? null,
    nombreCredits:   data?.nombreCredits     ?? null,
    packName:        data?.packName          ?? null,
    dureeMaxMinutes: data?.dureeMaxMinutes   ?? 15,
    isLoading,
    error,
    weekStart,
    weekEnd,
    from,
    to,
    isCurrentWeek,
    prevWeek,
    nextWeek,
    goToCurrentWeek,
    getSlot,
    addDiffusion:  addMutation.mutateAsync,
    adding:        addMutation.isPending,
    addError:      addMutation.error as (Error & { statusCode?: number }) | null,
    cancelDiffusion: (id: number, userId: number) =>
      cancelMutation.mutateAsync({ id, userId }),
    cancelling: cancelMutation.isPending
      ? (cancelMutation.variables?.id ?? null)
      : null,
  };
}