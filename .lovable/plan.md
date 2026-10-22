# Booking.com link: what to do (nothing in the app needs changing)

## What is happening
- In Booking.com, every "calendar connection" is two-way: Booking gives you a link to export your bookings, and asks for a link to import back.
- Your "Cleaning calendar" connection stays "Activating" until you give it an import link. The cleaning app has no calendar of its own to give back, so this one can't finish. Its export link doesn't work yet, so sync fails.
- Your "airbnb" connection is already finished (status OK, last exported 6 minutes ago). Its export link works.

## Steps
1. In Booking.com, on the "airbnb" row, open it and copy its **export** link (the one Booking.com gives you, usually ending in `.ics`). Don't copy the Airbnb link you pasted into Booking.
2. Paste that link into the Booking.com box in the app's Settings, tap Save, then tap Sync now.
3. Remove the "Cleaning calendar" row in Booking.com (or cancel "Complete setup"). You don't need it.

## If it still fails
- Send me a screenshot of the error in Settings and the start of the link (hide everything after `?`). I'll check if Booking.com uses a link the app doesn't accept yet.
