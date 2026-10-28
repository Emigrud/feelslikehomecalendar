# Comment for the cleaner on grey (blocked) days

## What changes
- When you tap a grey day, the block's card gets an **Add comment** button. If the block already has a comment, the button says **Edit comment**.
- Tapping it opens a box called "Comment" with **Save** and **Cancel**.
- Once saved, the comment shows in the same yellow box used on bookings. The cleaner will see it too once her link page is built (stage 5).
- Grey days that have a comment get the same comment sign in the calendar that bookings get.

## What stays
- The pencil, Delete block and Join back stay the same.
- Syncing never removes your comment.

## Technical details
- No database change. Comments save to `reservations.comment`, or to `reservation_splits.comment` when the block is part of a split, the same way ReservationEditForm saves them.
- New small `BlockCommentForm` (a text box, Save and Cancel) used inside the blocked branch of `ReservationCard` in DayDetails. The yellow comment box shows when `r.comment` is set.
- Check that MonthCalendar shows the comment sign on blocked cells, and add it if it doesn't.
