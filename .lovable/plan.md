Comment sign "C" on calendar days

What changes
- A small round "C" sign (yellow, matching the comment box colour) appears in the top-right corner of any day that has a comment for that day:
  - check-in day with a check-in comment,
  - check-out day with a check-out comment,
  - changeover day if either guest's comment for that day exists,
  - grey (blocked) day whose block has a comment.
- Light-blue staying days show no sign (they have no comment).
- The key under the calendar gets a new entry: the "C" sign with the text "Comment added".

Technical
- Add `hasDayComment(info)` in calendar.ts using the existing `dayComment` over `info.reservations`.
- New `CommentMark` component (small rounded badge using comment / comment-border tokens), rendered absolutely in MonthCalendar day cells and in Legend.
- Test: a check-in comment marks only the check-in day, a check-out comment only the check-out day.
