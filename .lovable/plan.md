# Fix Booking.com bookings vs. blocked dates

## What I found
I opened your Booking.com calendar file directly. Every entry in it says exactly the same thing: "CLOSED - Not available" — real bookings, dates you closed yourself, and dates with no price ("Action required") all look identical. There is no guest info and no way to tell them apart from the file.

- Nov 2–4 and Nov 6–9: in the file as "closed" — these are the dates you blocked, but the app shows them as Booking.com bookings.
- Nov 10–20: not in the Booking.com file at all. It only reaches the app through your Airbnb calendar, where Airbnb marks it "Not available" (because Airbnb copied it from Booking.com) — so it shows as grey.
- Dec 21 2026 – May 9 2027, May 16 – Oct 22 2027, Oct 23 2027 – Apr 22 2028: long "closed" stretches from missing prices, wrongly shown as bookings.

October looks fine only by chance.

## The fix
1. **Booking.com entries come in as grey blocked days by default**, not bookings. This removes the false bookings in November, December–January and later.
2. **"This is a real booking" button.** On any grey blocked day, tap it and choose "Mark as Booking.com booking" (or Airbnb). It turns into a normal booking with check-in/out colours and the "?" guest tag, so you can fill in guests, kids and a comment. Your choice is remembered — the next sync won't undo it. "Mark as blocked" switches it back.
3. **Long empty stretches are hidden.** Closed periods longer than 30 nights (like the missing-price months) are not shown at all, so the calendar isn't full of grey. Shorter blocks stay grey.
4. After the change I resync once and check November with you: Nov 10–20 grey (you mark it as a booking), Nov 2–4 and 6–9 grey.

Airbnb stays as it is: Airbnb's file does label its own bookings ("Reserved") separately from blocks, so those keep working automatically.

## Limits
Booking.com simply doesn't send booking details in this file, so a new Booking.com reservation will appear grey until you tap "Mark as booking". That's one tap per new booking.

## Technical details
- Parser: Booking.com events always `is_blocked = true`; events with > 30 nights from either source are skipped/cancelled on import.
- New column `reservations.owner_kind` (null | 'booking' | 'blocked') plus `owner_source`; set by the owner, never touched by `apply_calendar_feed`. Row mapping uses the owner override when present.
- Day popup: add the mark/unmark action for blocked entries (owner only); blocked days become tappable.
- Tests: Booking.com "CLOSED" imports as blocked; > 30-night block skipped; owner override survives a resync.
