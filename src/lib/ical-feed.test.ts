import { describe, expect, it } from "vitest";
import { parseFeed, validateFeedUrl, SYNC_SCHEDULE } from "./ical-feed";

const feed = (summary = "Reserved", status = "") => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:reservation-1\r\nDTSTART;VALUE=DATE:20261022\r\nDTEND;VALUE=DATE:20261025\r\nSUMMARY:${summary}\r\n${status}END:VEVENT\r\nEND:VCALENDAR`;
describe("calendar imports", () => {
  it("uses a two-hour schedule", () => expect(SYNC_SCHEDULE).toBe("0 */2 * * *"));
  it("imports dates without guest fields", () => expect(parseFeed(feed(), "booking")).toEqual([{ external_uid: "reservation-1", check_in: "2026-10-22", check_out: "2026-10-25", is_blocked: false, status: "active" }]));
  it("identifies Airbnb blocked dates", () => expect(parseFeed(feed("Airbnb (Not available)"), "airbnb")[0]?.is_blocked).toBe(true));
  it("recognizes explicit cancellations", () => expect(parseFeed(feed("Reserved", "STATUS:CANCELLED\r\n"), "airbnb")[0]?.status).toBe("cancelled"));
  it("accepts a genuinely empty calendar", () => expect(parseFeed("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR", "airbnb")).toEqual([]));
  it("rejects incomplete feeds instead of cancelling bookings", () => expect(() => parseFeed(feed().replace("END:VCALENDAR", ""), "airbnb")).toThrow());
  it.each(["http://www.airbnb.com/calendar", "https://127.0.0.1/feed", "https://airbnb.com.evil.example/feed", "https://user:pass@airbnb.com/feed", "https://booking.com:444/feed"]) ("rejects unsafe link %s", (url) => expect(() => validateFeedUrl(url, "airbnb")).toThrow());
  it("allows only the selected platform", () => expect(() => validateFeedUrl("https://admin.booking.com/calendar", "airbnb")).toThrow());
  it("accepts Booking.com export links", () => expect(validateFeedUrl("https://admin.booking.com/calendar", "booking")).toBe("https://admin.booking.com/calendar"));
});