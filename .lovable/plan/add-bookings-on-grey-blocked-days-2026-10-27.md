# Add bookings on grey (blocked) days

## What changes
When you tap a grey day, the popup now also shows **Add Airbnb booking** and **Add Booking.com booking**, the same buttons as on white days. **Block dates** is not shown there.

Tapping one opens the same two date boxes (yyyy/mm/dd). Check-in is filled in with the day you tapped and check-out with the next day. Tap Save.

## What stays
- The grey block keeps its own card: the pencil, Delete block (for your own blocks) and Join back.
- The block itself stays. Your new booking shows on top of it on the days it covers.
- Syncing never changes or removes bookings you add yourself.

## Technical details
- `AddEntryForm`: new `allowBlock` prop (default true). When false, hide the Block dates button.
- `DayDetails`: render `<AddEntryForm allowBlock={false} …>` when `info.kind` is `blocked` or `checkout-blocked`.
- Check `dayInfo` gives a manual booking priority over a block on the same days. Adjust it if needed and add a test for it.
