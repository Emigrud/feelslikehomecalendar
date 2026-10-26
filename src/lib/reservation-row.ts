import type { Reservation } from "./calendar";

export interface ReservationRow {
  id: string;
  source: string;
  check_in: string;
  check_out: string;
  guest_name: string | null;
  adults: number | null;
  kids_ages: number[] | null;
  comment: string | null;
  status: string;
  is_blocked: boolean;
  owner_kind?: string | null;
  owner_source?: string | null;
  first_part_blocked?: boolean | null;
  owner_check_in?: string | null;
  owner_check_out?: string | null;
  external_uid?: string | null;
}

/** Owner-adjusted dates win over the platform's; a broken pair falls back to the platform dates. */
export function stayDates(r: Pick<ReservationRow, "check_in" | "check_out" | "owner_check_in" | "owner_check_out">) {
  const checkIn = r.owner_check_in ?? r.check_in;
  const checkOut = r.owner_check_out ?? r.check_out;
  return checkIn < checkOut ? { checkIn, checkOut } : { checkIn: r.check_in, checkOut: r.check_out };
}

/** Convert a database row into the calendar's Reservation shape. */
export function rowToReservation(r: ReservationRow): Reservation {
  return {
    id: r.id,
    source: (r.owner_kind === "booking" && r.owner_source ? r.owner_source : r.source) === "booking" ? "booking" : "airbnb",
    ...stayDates(r),
    guestName: r.guest_name,
    adults: r.adults,
    kidsAges: r.kids_ages ?? [],
    comment: r.comment,
    status: r.status === "cancelled" ? "cancelled" : "active",
    isBlocked: r.owner_kind === "booking" ? false : r.owner_kind === "blocked" ? true : r.is_blocked,
    ownerKind: r.owner_kind === "booking" || r.owner_kind === "blocked" ? r.owner_kind : null,
    firstPartBlocked: r.first_part_blocked ?? null,
    isManual: !!r.external_uid?.startsWith("manual-"),
  };
}

export interface SplitRow {
  id: string;
  reservation_id: string;
  start_date: string;
  guest_name: string | null;
  adults: number | null;
  kids_ages: number[] | null;
  comment: string | null;
  is_blocked?: boolean | null;
}

/** Turn one stay into consecutive parts at the owner's changeover dates; each part can be greyed out on its own. */
export function expandSplits(r: Reservation, splits: SplitRow[]): Reservation[] {
  const mine = splits
    .filter((s) => s.reservation_id === r.id && s.start_date > r.checkIn && s.start_date < r.checkOut)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  if (mine.length === 0 || r.isBlocked) return [r];
  const ends = [...mine.map((s) => s.start_date), r.checkOut];
  const parts: Reservation[] = [{ ...r, checkOut: ends[0]!, parentId: r.id, splitId: null, isBlocked: !!r.firstPartBlocked }];
  mine.forEach((s, i) => parts.push({
    ...r, id: `${r.id}#${s.start_date}`, parentId: r.id, splitId: s.id,
    checkIn: s.start_date, checkOut: ends[i + 1]!,
    guestName: s.guest_name, adults: s.adults, kidsAges: s.kids_ages ?? [], comment: s.comment,
    isBlocked: !!s.is_blocked,
  }));
  return parts;
}

/** A changeover date must fall strictly inside the stay. */
export function isValidSplitDate(r: Pick<Reservation, "checkIn" | "checkOut">, date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date > r.checkIn && date < r.checkOut;
}
