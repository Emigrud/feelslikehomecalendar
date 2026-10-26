# Add a booking by hand on green, blue and red days

## What you'll see
- Tap any green (check-in), light blue (staying) or red (check-out) day, including half-red/half-green changeover days. Under the existing booking card there's a new **Add check-in** button.
- Tap it and choose **Airbnb** or **Booking.com**. Two date boxes open in yyyy/mm/dd:
  - **Check-in** is filled in with the day you tapped (12 Nov gives 2026/11/12).
  - **Check-out** is filled in with the next day.
  - You can edit either box or pick from the calendar sign.
- Tap **Save** and the new booking appears with its own guest numbers, name, comment, date pencil, Mark as blocked and Delete. Syncing never changes or removes it.
- Grey (blocked) and white days don't change. White days keep their current add buttons.

## How overlaps show
- If your new booking falls inside an Airbnb or Booking.com stay (for example 14–17 inside 10–20), **your booking wins on its days**:
  - 14 Nov shows as a changeover: the earlier guest leaves, your guest arrives.
  - 15–16 show your guest.
  - 17 shows your guest checking out, plus the synced stay continuing.
- The synced stay itself isn't changed. Delete your booking and everything goes back to how it was.

## Technical details
- `AddEntryForm` gets an `occupied` mode: it shows only "Add check-in", then the Airbnb/Booking choice, then the same date form and insert (`manual-<uuid>`, `is_blocked=false`). The overlap warning is hidden in this mode.
- `DayDetails` renders it below the cards when `editable` and the day kind is checkin, checkout, changeover or staying.
- `dayInfo`: when a manual booking and a synced booking overlap, prefer the manual one for check-in, check-out and staying. On the manual booking's check-in day, a covering synced stay counts as the check-out, giving a changeover. On days after the manual booking ends, the synced stay still shows as staying or check-in.
- Tests in `calendar.test.ts` cover 10–20 synced plus 14–17 manual: the 14th is a changeover, the 15th shows the manual guest, the 18th shows the synced stay.
