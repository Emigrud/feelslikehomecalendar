import type { Reservation } from "./calendar";

export interface CleaningItem {
  id: string;
  departure: Reservation;
  date: string; // departure (check-out) day
  next: Reservation | null; // next real arrival on or after the departure day
  sameDay: boolean;
  /** Owner's planned cleaning, kept even when it no longer fits. */
  plan: { date: string; time: string | null } | null;
  /** Plan falls before the departure or after the next arrival. */
  planInvalid: boolean;
  /** Another booking overlaps the departing stay's nights; instructions may be wrong. */
  overlap: boolean;
}

/** Real guest stays only: active, not greyed out. */
function guests(all: Reservation[]) {
  return all.filter((r) => r.status === "active" && !r.isBlocked);
}

/** One cleaning per departure of a real booking, linked to the next real arrival. Blocks never create cleanings. */
export function buildCleanings(all: Reservation[]): CleaningItem[] {
  const stays = guests(all);
  return stays
    .map((d) => {
      const next = stays
        .filter((r) => r !== d && r.checkIn >= d.checkOut)
        .sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0] ?? null;
      const overlap = stays.some((r) => r !== d && r.checkIn < d.checkOut && r.checkOut > d.checkIn);
      const plan = d.cleaningDate ? { date: d.cleaningDate, time: d.cleaningTime ?? null } : null;
      const planInvalid = !!plan && (plan.date < d.checkOut || (!!next && plan.date > next.checkIn));
      return { id: d.id, departure: d, date: d.checkOut, next, sameDay: !!next && next.checkIn === d.checkOut, plan, planInvalid, overlap };
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function isTime(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}
