import { useState, useEffect, useCallback } from 'react';
import { get, post, patch } from './base';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DPStatus = 'planned' | 'sent' | 'cancelled' | 'skipped';

export interface PlanningItem {
  id:               number;
  souscriptionId:   number;
  sireneId:         number;
  sireneName:       string | null;
  scheduledDate:    string;
  scheduledHeure:   7 | 12 | 16;
  status:           DPStatus;
  observation:      string | null;
  notificationId:   number | null;
  notifStatus:      string | null;
  notifMessage:     string | null;
  canCancel:        boolean;
  // ── Enrichis par le backend ───────────────────────────────────────────────
  customerName:     string | null;
  customerId:       number | null;
  sousCategorieId:  number | null;
  sousCategorieNom: string | null;   // affiché en titre de card
  alerteAudioId:    number | null;
  alerteAudioName:  string | null;
  // ── Optionnel : liste notifications (enrichissement futur) ────────────────
  notifications?: { id: number; status: string; message?: string }[];
}

export interface PlanningSlot {
  date:  string;
  heure: 7 | 12 | 16;
  items: PlanningItem[];
}

export interface WeekStats {
  planned: number; sent: number; cancelled: number; skipped: number; total: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getMondayOf(d: Date): Date {
  const day  = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}
export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
export const JOURS_FR  = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export const CRENEAUX: (7 | 12 | 16)[] = [7, 12, 16];

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePlanning(opts: {
  customerId?:       number;
  souscriptionId?:   number;
  filterCustomerId?: number;
  filterSireneId?:   number;
}) {
  const [weekStart,  setWeekStart]  = useState<Date>(() => getMondayOf(new Date()));
  const [slots,      setSlots]      = useState<PlanningSlot[]>([]);
  const [stats,      setStats]      = useState<WeekStats | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const weekEnd       = addDays(weekStart, 6);
  const isCurrentWeek = toISO(getMondayOf(new Date())) === toISO(weekStart);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        from: toISO(weekStart),
        to:   toISO(weekEnd),
      };
      if (opts.customerId)       params.customerId       = opts.customerId;
      if (opts.souscriptionId)   params.souscriptionId   = opts.souscriptionId;
      if (opts.filterCustomerId) params.customerId       = opts.filterCustomerId;
      if (opts.filterSireneId)   params.sireneId         = opts.filterSireneId;

      const query = new URLSearchParams(params as any).toString();

      const [planRes, statsRes] = await Promise.all([
        get<PlanningSlot[]>(`/planning-diffusion?${query}`),
        get<WeekStats>(`/planning-diffusion/stats?${query}`),
      ]);

      console.log('planRes :',planRes);
      setSlots(Array.isArray(planRes) ? planRes : []);
      setStats(statsRes ?? null);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [weekStart, opts.customerId, opts.souscriptionId, opts.filterCustomerId, opts.filterSireneId]);

  useEffect(() => { fetch(); }, [fetch]);

  const prevWeek        = () => setWeekStart(d => addDays(d, -7));
  const nextWeek        = () => setWeekStart(d => addDays(d,  7));
  const goToCurrentWeek = () => setWeekStart(getMondayOf(new Date()));

  const cancelItem = async (id: number, userId: number) => {
    setCancelling(id);
    try {
      await patch(`/planning-diffusion/${id}/cancel`, { cancelledBy: userId });
      await fetch();
    } catch (e: any) {
      setError(e?.message ?? "Impossible d'annuler");
    } finally {
      setCancelling(null);
    }
  };

  const triggerDate = async (date: string) => {
    setTriggering(true);
    setError(null);
    try {
      const res = await post<any>(`/planning-diffusion/trigger/${date}`, {});
      await fetch();
      return res;
    } catch (e: any) {
      setError(e?.message ?? 'Erreur lors du déclenchement');
      return null;
    } finally {
      setTriggering(false);
    }
  };

  const getSlot = (dateStr: string, heure: number): PlanningSlot | undefined =>
    slots.find(s => s.date === dateStr && s.heure === heure);

  return {
    weekStart, weekEnd, isCurrentWeek,
    slots, stats, loading, error, cancelling, triggering,
    prevWeek, nextWeek, goToCurrentWeek,
    cancelItem, triggerDate, getSlot, refresh: fetch,
  };
}