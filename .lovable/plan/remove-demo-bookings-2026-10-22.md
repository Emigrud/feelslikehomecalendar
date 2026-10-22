# Remove demo bookings

## What changes
- Delete all the sample bookings that "Add demo bookings" created. Your real Airbnb and Booking.com bookings stay exactly as they are, including any guest details you typed in.
- Remove the "Add demo bookings" button, so samples can't be mixed in with real bookings again.

## Technical details
- One data delete: rows in reservations where external_uid starts with `demo-`.
- Remove the demo button and mutation from the calendar page, and the addDemoBookings helper in apartment-data.ts. The sample-data file is kept only if tests still use it.
- Afterwards, confirm the calendar shows only the imported bookings.
