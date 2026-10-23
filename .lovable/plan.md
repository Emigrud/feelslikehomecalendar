# Guest 24–25 Oct plus your block on 25 Oct

## What Booking.com sends
I checked the dates saved from this morning's sync. Booking.com sends a single entry: **24 Oct to 26 Oct**, labelled "CLOSED - Not available" like everything else. It joins the guest's night (24–25) and your block (25–26) into one stretch, just like it did with 10–20 November. So the app shows a 2-night Booking.com stay that checks out on the 26th, and the cleaner would see the wrong check-out day.

## The fix
Use the Split button you already have, and let each part be marked separately:
1. Tap 25 Oct, then **Split booking**. The date is already filled in, so tap **Split here**. You now have 24–25 and 25–26.
2. On the 25–26 part, tap **Mark as blocked**. Only that part turns grey. 24 Oct stays a check-in and 25 Oct shows as a check-out, followed by your blocked day.
3. **Mark as booking** turns it back, and **Join back** undoes the split.
4. Syncing keeps this. If Booking.com changes the overall dates, the split is cleared, as it is now.

Right now "Mark as blocked" on a split part greys out the whole 24–26 stretch. You've already split at the 25th and pressed it, so that's what you see now. I'll change it so only the tapped part turns grey. Then I'll switch 24–25 back to the guest's stay and leave 25–26 grey.

## Technical details
- Add `is_blocked boolean` (nullable, owner-set) to `reservation_splits`. In `expandSplits`, a part whose split row has it set becomes `isBlocked: true`. The first part uses the reservation's own `owner_kind` only when no splits exist. Otherwise add a `first_part_blocked` flag on the reservation and keep it in the existing clear-on-date-change trigger.
- In DayDetails, `mark()` on a split part updates its split row (or the first-part flag) instead of the parent's `owner_kind`. Blocked split parts keep the "Join back" option.
- Tests: splitting 24–26 at 25 and blocking the second part gives check-in on the 24th, check-out on the 25th and blocked on the 25th; blocking a part doesn't change the other part.
