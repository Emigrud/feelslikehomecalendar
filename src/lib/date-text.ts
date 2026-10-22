/** Dates are typed and shown as yyyy/mm/dd everywhere the owner edits them. */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** "2026-11-12" (database) -> "2026/11/12" (what the owner sees). */
export function toDisplayDate(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.replaceAll("-", "/") : "";
}

/** Keep the box tidy while typing: digits only, slashes after the year and the month. */
export function formatTyping(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter((p) => p !== "").join("/");
}

/** Accept what the owner typed and return the database date, or null while it is incomplete or wrong. */
export function fromDisplayDate(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  if (year.length !== 4 || month.length !== 2 || day.length !== 2) return null;
  const m = Number(month);
  const d = Number(day);
  if (m < 1 || m > 12) return null;
  const lastDay = new Date(Date.UTC(Number(year), m, 0)).getUTCDate();
  if (d < 1 || d > lastDay) return null;
  return `${year}-${month}-${day}`;
}

/** Move a database date by whole days (leap years and month ends included). */
export function shiftISO(iso: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  const d = Number(iso.slice(8, 10));
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Database date -> local Date object, for the month picker. */
export function isoToDate(iso: string): Date {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  const d = Number(iso.slice(8, 10));
  return new Date(y, m - 1, d);
}

/** Local Date object from the month picker -> database date. */
export function dateToISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
