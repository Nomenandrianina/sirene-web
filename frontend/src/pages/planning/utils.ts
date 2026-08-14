import { toISO } from '@/types/useplanningclient';

export function isToday(iso: string): boolean {
  return iso === toISO(new Date());
}