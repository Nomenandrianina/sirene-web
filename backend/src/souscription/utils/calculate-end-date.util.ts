import { PackType, Periode } from '@/packtype/entities/packtype.entity';

export function calculateEndDate(start: Date, pack: PackType): Date {
  const end = new Date(start);
  switch (pack.periode) {
    case Periode.WEEKLY:  end.setDate(end.getDate() + 7); break;
    case Periode.MONTHLY: end.setMonth(end.getMonth() + 1); break;
    case Periode.YEARLY:  end.setFullYear(end.getFullYear() + 1); break;
  }
  return end;
}