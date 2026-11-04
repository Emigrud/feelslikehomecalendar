export type Source = "airbnb" | "booking";

export interface Reservation {
  id: string;
  source: Source;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guestName?: string | null;
  adults?: number | null; // null = not filled in yet
  kidsAges?: number[] | null;
  comment?: string | null; // blocks only
  checkInComment?: string | null;
  checkOutComment?: string | null;
  status: "active" | "cancelled";
  isBlocked: boolean;
  /** Owner's manual choice; survives calendar syncs. */
  ownerKind?: "booking" | "blocked" | null;
  /** Set when this is one part of a split stay: database reservation id. */
  parentId?: string;
  /** Set for the 2nd+ part of a split stay: id of its split row. */
  splitId?: string | null;
  /** Owner greyed out the first part of a split stay. */
  firstPartBlocked?: boolean | null;
  /** Added by hand by the owner; syncs never touch it and it can be deleted. */
  isManual?: boolean;
  /** Owner's planned cleaning after this stay's departure. */
  cleaningDate?: string | null;
  cleaningTime?: string | null;
}

export type DayKind = "empty" | "checkin" | "checkout" | "changeover" | "checkout-blocked" | "staying" | "blocked";

export interface DayInfo {
  date: string;
  kind: DayKind;
  checkIn?: Reservation | undefined;
  checkOut?: Reservation | undefined;
  staying?: Reservation | undefined;
  /** Reservations to show in the popup, check-out first. */
  reservations: Reservation[];
}

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromKey(key: string): Date {
  const [y = 0, m = 1, d = 1] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 6x7 or 5x7 grid of dates for the month, Monday first. */
export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday = 0
  const start = new Date(year, month, 1 - offset);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Math.ceil((offset + daysInMonth) / 7) * 7;
  return Array.from({ length: cells }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

export function dayInfo(date: string, all: Reservation[]): DayInfo {
  const live = all.filter((r) => r.status === "active");
  // An Airbnb block with the exact dates of a Booking.com entry is the same stay copied over.
  const active = live.filter((r) => !(r.isBlocked && r.source === "airbnb" && !r.ownerKind &&
    live.some((b) => b.source === "booking" && b.checkIn === r.checkIn && b.checkOut === r.checkOut)));
  const guests = active.filter((r) => !r.isBlocked);
  // Owner-added bookings win over synced stays on the days they cover.
  const manual = guests.filter((r) => r.isManual);
  const synced = guests.filter((r) => !r.isManual);
  const mIn = manual.find((r) => r.checkIn === date);
  const mOut = manual.find((r) => r.checkOut === date);
  const mStay = manual.find((r) => r.checkIn < date && date < r.checkOut);
  const covering = synced.find((r) => r.checkIn < date && date < r.checkOut);
  let checkIn: Reservation | undefined, checkOut: Reservation | undefined, staying: Reservation | undefined;
  if (mStay) {
    staying = mStay;
  } else {
    checkIn = mIn ?? synced.find((r) => r.checkIn === date);
    checkOut = mOut ?? synced.find((r) => r.checkOut === date) ?? (mIn ? covering : undefined);
    staying = checkIn || checkOut ? (mOut && !mIn ? covering : undefined) : covering;
  }
  const blocked = active.find((r) => r.isBlocked && r.checkIn <= date && date < r.checkOut);

  let kind: DayKind = "empty";
  if (checkOut && checkIn) kind = "changeover";
  else if (checkIn) kind = "checkin";
  else if (checkOut && blocked) kind = "checkout-blocked";
  else if (checkOut) kind = "checkout";
  else if (staying) kind = "staying";
  else if (blocked) kind = "blocked";

  const reservations = [checkOut, checkIn, staying].filter(Boolean) as Reservation[];
  if ((kind === "blocked" || kind === "checkout-blocked") && blocked) reservations.push(blocked);
  return { date, kind, checkIn, checkOut, staying, reservations };
}

/** "2+1", "2", or "?" when the owner hasn't filled in adults yet. */
export function guestLabel(r: Reservation): string {
  if (r.adults == null) return "?";
  const kids = r.kidsAges?.length ?? 0;
  return kids > 0 ? `${r.adults}+${kids}` : `${r.adults}`;
}

export function nights(r: Reservation): number {
  return Math.round((fromKey(r.checkOut).getTime() - fromKey(r.checkIn).getTime()) / 86400000);
}

export const sourceName = (s: Source) => (s === "airbnb" ? "Airbnb" : "Booking.com");

export function formatShort(key: string): string {
  return fromKey(key).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/** The comment that belongs to this booking on this day: check-in day → check-in comment, check-out day → check-out comment, blocks → their own comment. */
export function dayComment(r: Reservation, info: Pick<DayInfo, "checkIn" | "checkOut">): string | null {
  if (r.isBlocked) return r.comment ?? null;
  if (r === info.checkIn) return r.checkInComment ?? null;
  if (r === info.checkOut) return r.checkOutComment ?? null;
  return null;
}

/** True when any booking or block on this day has a comment that belongs to this day. */
export function hasDayComment(info: DayInfo): boolean {
  return info.reservations.some((r) => !!dayComment(r, info)?.trim());
}
