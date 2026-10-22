# Booking.com: show reservations again by default

## What went wrong
You're right that my last change made things worse. Before it, every Booking.com entry showed as a booking. Most of your Booking.com entries really are reservations, so October looked right. I flipped the default so every Booking.com entry came in grey. That fixed your two November blocks but broke every real reservation, including 24–25 October.

## What the two calendar files actually contain today
I downloaded both files just now.

Booking.com (all six say "CLOSED - Not available", with no other details):
- 24–25 Oct
- 6–9 Nov
- 10–20 Nov
- 21 Dec 2026 – 9 May 2027, 16 May – 22 Oct 2027, 23 Oct 2027 – 22 Apr 2028 (the months with no price)

Airbnb:
- "Reserved" (real Airbnb guests): 4–6 Nov, 9–16 May 2027
- "Not available": 20–24 Oct, 27–31 Oct, 22–23 Oct 2027

Not in Booking.com's file any more:
- 27–31 Oct: it was there earlier this morning and then disappeared, so the app marked it as cancelled.
- 20–24 Oct: never in Booking.com's file. It only reaches the app as an Airbnb "Not available" block, which is probably Airbnb copying a Booking.com stay.

So the file really does use the same words for everything. The mistake was choosing "blocked" as the default instead of "reservation".

## The fix
1. **Booking.com entries show as reservations again by default.** 24–25 Oct, 6–9 Nov and 10–20 Nov get check-in/check-out colours and "?".
2. **Hide the long no-price stretches.** Anything over 30 nights stays hidden, as now, so December to May doesn't show as a booking.
3. **Your own blocks are one tap.** On a Booking.com booking, tap **Mark as blocked** and it turns grey. Syncing never undoes this. **Mark as booking** switches it back.
4. **Remove Airbnb duplicates.** When an Airbnb "Not available" block has exactly the same dates as a Booking.com entry, it's the same stay copied over, so only the Booking.com booking is shown.
5. **Fix today's data.** Undo the earlier conversion so October shows correctly again, then resync and check October and November with you.

## Please confirm
- Confirmed: **20–24 Oct**, **27–31 Oct** and **6–9 Nov** are your own blocks, not guests. 20–24 and 27–31 Oct stay grey (Airbnb "Not available"). I'll mark 6–9 Nov as blocked once, and syncing won't change it back.

## Technical details
- `parseFeed`: Booking.com `is_blocked = false` again; the >30-night rule (status cancelled) stays.
- Owner override columns stay as they are (`owner_kind` booking/blocked plus `owner_source`). The popup offers "Mark as blocked" on any booking and "Mark as … booking" on grey blocks (already built).
- Calendar merge: an active Airbnb blocked row with the same check-in/out as an active Booking.com row is left out of the view, in `dayInfo`'s input filtering.
- Data repair: set `is_blocked = false` on active Booking.com rows with no owner override; keep the 10–20 Nov override.
- Tests: Booking.com entries default to reservations; an Airbnb block with dates matching a Booking.com entry is hidden; an owner "blocked" choice survives a resync.
