export type Cot = "unknown" | "yes" | "no";
export type PrepStatus = "pending" | "confirmed";

export interface Preparation {
  beds: string[];
  bedNote: string | null;
  cot: Cot;
  towels: number | null;
  status: PrepStatus;
  checkInTime: string | null; // per-booking override, HH:MM
  checkOutTime: string | null; // per-booking override, HH:MM
  arrivalTime: string | null; // confirmed guest arrival, HH:MM
}

export interface ApartmentTimes {
  checkInTime: string | null; // standard
  checkOutTime: string | null; // standard
  timezone: string;
  bedOptions: string[];
}

export const EMPTY_PREP: Preparation = { beds: [], bedNote: null, cot: "unknown", towels: null, status: "pending", checkInTime: null, checkOutTime: null, arrivalTime: null };

/** "HH:MM", 24-hour. */
export function isTime(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

/** Empty → null; "9:5"-style typos are rejected; "9:30" becomes "09:30". undefined = invalid. */
export function parseTime(s: string): string | null | undefined {
  const t = s.trim();
  if (!t) return null;
  const padded = /^\d:\d\d$/.test(t) ? `0${t}` : t;
  return isTime(padded) ? padded : undefined;
}

/** Empty → null; whole number 0–30. undefined = invalid. */
export function parseTowels(s: string): number | null | undefined {
  const t = s.trim();
  if (!t) return null;
  if (!/^\d+$/.test(t)) return undefined;
  const n = Number(t);
  return n <= 30 ? n : undefined;
}

type PrepFields = Omit<Preparation, "status">;
const KEYS: (keyof PrepFields)[] = ["beds", "bedNote", "cot", "towels", "checkInTime", "checkOutTime", "arrivalTime"];

export function prepChanged(a: PrepFields, b: PrepFields): boolean {
  return KEYS.some((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
}

/** Changing confirmed details sends them back to Pending unless the owner confirms in the same save. */
export function nextStatus(before: Preparation, after: PrepFields, confirmNow: boolean): PrepStatus {
  if (confirmNow) return "confirmed";
  if (before.status === "confirmed" && !prepChanged(before, after)) return "confirmed";
  return "pending";
}

/** Booking override wins; otherwise the apartment standard, marked as such. */
export function shownTime(override: string | null, standard: string | null): { time: string | null; standard: boolean } {
  if (override) return { time: override, standard: false };
  return { time: standard, standard: !!standard };
}

export const COT_LABEL: Record<Cot, string> = { unknown: "Unknown", yes: "Yes", no: "No" };

export function timezoneLabel(tz: string): string {
  return tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
}

export interface PrepRow {
  prep_beds?: string[] | null;
  prep_bed_note?: string | null;
  prep_cot?: string | null;
  prep_towels?: number | null;
  prep_status?: string | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  arrival_time?: string | null;
}

export function rowToPrep(r: PrepRow): Preparation {
  return {
    beds: r.prep_beds ?? [],
    bedNote: r.prep_bed_note ?? null,
    cot: r.prep_cot === "yes" || r.prep_cot === "no" ? r.prep_cot : "unknown",
    towels: r.prep_towels ?? null,
    status: r.prep_status === "confirmed" ? "confirmed" : "pending",
    checkInTime: r.checkin_time ?? null,
    checkOutTime: r.checkout_time ?? null,
    arrivalTime: r.arrival_time ?? null,
  };
}

export function prepToRow(p: Preparation) {
  return {
    prep_beds: p.beds, prep_bed_note: p.bedNote, prep_cot: p.cot, prep_towels: p.towels, prep_status: p.status,
    checkin_time: p.checkInTime, checkout_time: p.checkOutTime, arrival_time: p.arrivalTime,
  };
}

export const PREP_COLS = "prep_beds, prep_bed_note, prep_cot, prep_towels, prep_status, checkin_time, checkout_time, arrival_time";
