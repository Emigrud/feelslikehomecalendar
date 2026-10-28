Separate check-in and check-out comments

What changes
- Each booking gets two comments: a **check-in comment** and a **check-out comment**, saved separately.
- Tapping a day opens its popup. On a green (check-in) day, the booking's card shows only its check-in comment, with **Add / Edit / Delete check-in comment**. On a red (check-out) day it shows only the check-out comment, with **Add / Edit / Delete check-out comment**.
- A changeover day shows the leaving guest's check-out comment and the arriving guest's check-in comment, each in its own card.
- Hovering works the same way: the card shows only the comment that belongs to that day.
- Deleting or editing one comment never touches the other.
- The comment box is removed from **Edit details**, which keeps adults, kids and name.
- Light-blue (staying) days show no comment.
- Your existing comments become check-in comments, so nothing is lost.
- Grey (blocked) days keep their single comment, as now.
- Split stays: each part has its own check-in and check-out comments.
- Syncing never touches either comment.

Technical
- Migration: add nullable `checkin_comment`, `checkout_comment` to reservations and reservation_splits; backfill `checkin_comment = comment` for non-blocked rows; COMMENT the old `comment` as deprecated for guest bookings (it stays in use for blocks).
- Reservation type gains checkInComment/checkOutComment; select and map them in apartment-data / reservation-row (expandSplits too).
- DayDetails: new DayCommentEditor(r, which: "in" | "out") with add/edit/delete, writing to the split row or parent reservation. ReservationCard picks the role: "in" → check-in comment, "out" → check-out comment, "stay" → none.
- DayHoverSummary uses the same role logic (r === info.checkIn / info.checkOut).
- Remove the comment field from ReservationEditForm.
- Tests: role-based comment selection (a check-in comment is not shown on the check-out day, and the reverse), plus row mapping.
