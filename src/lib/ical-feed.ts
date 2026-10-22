import ICAL from "ical.js";
import type { Source } from "./calendar";

export const SYNC_SCHEDULE = "0 */2 * * *";
/** Closed stretches longer than this (e.g. months without prices) are hidden. */
export const MAX_NIGHTS = 30;
export type FeedEvent = { external_uid: string; check_in: string; check_out: string; is_blocked: boolean; status: "active" | "cancelled" };

export function validateFeedUrl(value: string, source: Source): string {
  const raw = value.trim();
  if (!raw) return "";
  if (raw.length > 2048) throw new Error("Calendar link is too long.");
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Enter a valid HTTPS calendar link."); }
  const domains = source === "airbnb" ? ["airbnb.com", "airbnb.co.uk", "airbnb.fr", "airbnb.de", "airbnb.it", "airbnb.es", "airbnb.ie", "airbnb.ca", "airbnb.com.au"] : ["booking.com"];
  const allowed = domains.some((d) => url.hostname === d || url.hostname.endsWith(`.${d}`));
  if (url.protocol !== "https:" || !allowed || url.username || url.password || (url.port && url.port !== "443")) {
    throw new Error(`Use an HTTPS calendar export link from ${source === "airbnb" ? "Airbnb" : "Booking.com"}.`);
  }
  url.hash = "";
  return url.toString();
}

export function parseFeed(text: string, source: Source): FeedEvent[] {
  if (!text.trim().startsWith("BEGIN:VCALENDAR") || !text.trim().endsWith("END:VCALENDAR")) throw new Error("Not a complete calendar file.");
  const calendar = new ICAL.Component(ICAL.parse(text));
  const events = calendar.getAllSubcomponents("vevent");
  if (events.length > 10000) throw new Error("Calendar file has too many bookings.");
  const seen = new Set<string>();
  return events.map((component) => {
    if (component.hasProperty("rrule") || component.hasProperty("recurrence-id")) throw new Error("Recurring calendar events are not supported.");
    const event = new ICAL.Event(component);
    const uid = event.uid;
    const start = event.startDate;
    const end = event.endDate;
    if (!uid || uid.length > 1024 || !start || !end || seen.has(uid)) throw new Error("Calendar contains an invalid booking.");
    seen.add(uid);
    const key = (t: ICAL.Time) => `${String(t.year).padStart(4, "0")}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}`;
    const check_in = key(start), check_out = key(end);
    if (check_out <= check_in) throw new Error("Calendar contains invalid booking dates.");
    const summary = (event.summary ?? "").trim();
    const longClosure = (Date.UTC(end.year, end.month - 1, end.day) - Date.UTC(start.year, start.month - 1, start.day)) / 86400000 > MAX_NIGHTS;
    return {
      external_uid: uid, check_in, check_out,
      // Booking.com's file labels bookings and closed dates identically, so all come in as blocked.
      is_blocked: source === "booking" || /^(airbnb \(not available\)|not available|unavailable|blocked)(\b|$)/i.test(summary),
      status: longClosure || String(component.getFirstPropertyValue("status") ?? "").toUpperCase() === "CANCELLED" ? "cancelled" : "active",
    };
  });
}

export async function downloadFeed(url: string, source: Source): Promise<FeedEvent[]> {
  const safeUrl = validateFeedUrl(url, source);
  const response = await fetch(safeUrl, { redirect: "manual", signal: AbortSignal.timeout(15000), headers: { Accept: "text/calendar" } });
  if (!response.ok) throw new Error("Calendar download failed.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Calendar file is empty.");
  const decoder = new TextDecoder();
  let text = "", size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2 * 1024 * 1024) throw new Error("Calendar file is too large.");
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return parseFeed(text, source);
  } finally { await reader.cancel().catch(() => {}); }
}