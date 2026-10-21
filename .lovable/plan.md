# Apartment Cleaning Calendar — Understanding (no build yet)

## What I understood
- One rental apartment, two users: Owner (email login, full edit) and Cleaner (private link, read-only, no login, phone first).
- Reservation dates come in automatically from Airbnb and Booking.com calendar links. Guest numbers, kids' ages, name and comment are typed in by the owner. Until the owner fills them in, the day shows "?".
- Monthly calendar, weeks start on Monday. Green = check-in, red = check-out, split diagonally red/green on changeover days, light blue = guest staying, grey = Airbnb blocked days. Each cell shows A or B for the platform and the guest count ("2+1" or "?").
- Tapping a day opens details (bottom sheet on phone, dialog on desktop). Check-out is shown first, the comment sits in a yellow box, and the owner gets an Edit button.
- Sync runs every 2 hours and when the owner presses "Sync now". It updates dates only and never overwrites what the owner typed. Cancelled bookings get hidden. Settings shows last sync time and any errors.
- Settings: both calendar links, sync status, cleaner link (copy / make a new one), apartment name.
- Three-part data setup (apartments, reservations), with owner-only access rules. The cleaner reads through a safe server door that checks the link code.
- Out of scope: reading emails, multiple apartments on screen, notifications, writing back to platforms, "done" marking, languages.

## Platform adjustments
- Database, login and server logic will use Lovable Cloud (same capabilities as your spec).
- The calendar downloads and the cleaner door run as server functions inside the app instead of separate Edge Functions. Same behaviour.

## Proposed stages (to confirm)
1. Calendar look with sample data: month view, colors, legend, details popup, phone layout.
2. Lovable Cloud: tables, owner login, access rules.
3. Owner editing: guest numbers, kids' ages, name, comment.
4. Settings + calendar sync (Sync now, then every 2 hours).
5. Cleaner private link page + link regeneration.

Nothing gets built until you approve each stage.
