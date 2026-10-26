# Remove "Mark as booking" from blocked days

## What changes
In the day popup for a grey (blocked) day, remove:
- **Mark as booking** (shown on a blocked part of a split stay)
- **Is this actually a guest booking?** with **Mark as Booking.com booking** and **Mark as Airbnb booking**

## What stays
- The date pencil on blocked days
- **Delete block** for blocks you added yourself
- **Join back with previous guest** on split parts
- Choices you already made (for example, 10–20 November stays a booking, 6–9 November stays blocked). Syncing still respects them.
- **Mark as blocked** on guest bookings

## Technical details
- In `src/components/calendar/DayDetails.tsx`, blocked branch of `ReservationCard`: delete the "Mark as booking" button and the whole "Is this actually a guest booking?" block. Keep the Join back button on its own.
- `mark()` is still used by "Mark as blocked", so it stays. No database changes.
