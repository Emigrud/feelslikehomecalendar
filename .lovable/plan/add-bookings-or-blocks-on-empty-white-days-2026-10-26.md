# Add bookings or blocks on empty (white) days

## What you'll get
- Tap any white day on the calendar. A popup opens with three choices:
  - **Add Airbnb booking**
  - **Add Booking.com booking**
  - **Block dates**
- Two date boxes open (yyyy/mm/dd, editable, Monday-first calendar sign). Check-in is pre-filled with the day you tapped and check-out with the next day. Change either one, then tap **Save**.
- The new entry shows on the calendar like any other: green check-in, red check-out, light blue staying days, grey striped block.
- Tap it later and you get the same tools as synced bookings: Edit details (guests, kids, name, comment), pencil to change dates, Split booking, Mark as blocked / Mark as booking.
- Bookings you add yourself also get a **Delete** button. Synced bookings don't get one, since Airbnb or Booking.com would send them back.
- Syncing never changes or removes entries you added yourself.
- If the dates you pick overlap an existing booking, you'll see a warning, but you can still save. That covers cases like a block starting on a guest's check-out day.

## Technical details
- Store hand-added entries in `reservations` with `external_uid = 'manual-<uuid>'`. `source` is airbnb or booking (no new platform). Blocks get `is_blocked = true`, and their source defaults to the owner's choice or airbnb.
- Migration: change `apply_calendar_feed` so it never cancels or updates rows whose external_uid starts with `manual-`. Today it only skips `demo-`. The existing owner-only row access rules already allow inserting and deleting.
- Add `isManual` to the `Reservation` type, mapped in `rowToReservation`.
- `MonthCalendar`: empty days become tappable and call `onSelectDay` with an empty `DayInfo`. `DayDetails` shows a new `AddEntryForm` when the day has no reservations. It reuses `SplitDateField` and inserts the row, then refreshes the `apartment` query.
- `DayDetails`: Delete button when `r.isManual`.
- Tests: manual rows map with `isManual`. Sync leaves `manual-` rows alone, using the existing apply logic test pattern.
