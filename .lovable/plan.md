# Split a merged Booking.com stay into separate bookings

## What the file shows
I re-downloaded Booking.com's calendar file just now. For November it contains only one entry: **10 Nov to 20 Nov**, as a single block. Booking.com joins back-to-back reservations into one stretch in its export, so the changeover dates between your guests are not in the file. The app can't work them out by itself.

## What I'll build
- A **"Split booking"** button in the day popup for any booking.
- You choose a changeover date (for example 14 Nov). The stay becomes two bookings: 10–14 and 14–20. You can split again for a third guest.
- Each part has its own guest numbers, name and comment, and the calendar shows a proper changeover day (half red, half green) on each split date.
- A **"Join back"** option undoes a split.
- Syncing keeps your splits. If Booking.com later changes the overall dates of that stretch, the splits are cleared and the stay goes back to one piece, so you never see old dates.

## Technical details
- New table `reservation_splits` (reservation_id, split_date, plus guest fields per segment), owner-only with row access rules and grants.
- `rowToReservation` expands a reservation with splits into multiple calendar `Reservation`s (ids `uid#n`); calendar components stay unchanged.
- `apply_calendar_feed` deletes splits when a feed event's check_in/check_out changes.
- Tests: splitting 10–20 at 14 gives 10–14 and 14–20; a date outside the stay is rejected; changing feed dates clears splits.
