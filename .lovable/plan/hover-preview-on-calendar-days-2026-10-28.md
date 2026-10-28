Hover preview on calendar days

What changes
- On a computer, resting the mouse on a green (check-in), red (check-out), changeover, light-blue (staying)... limited to check-in, check-out, changeover, out+blocked and grey (blocked) days shows a small card next to the day, with no click needed.
- The card shows, for each booking on that day: platform mark and name, dates and nights, adults, kids with ages, guest name (or "Guest numbers not filled in yet"), and the yellow comment box if there is one. Grey days show "Blocked", the dates and the comment.
- The card stays open while the mouse is on the day or on the card itself, and closes when the mouse leaves both.
- Clicking a day still opens the full day popup as before. Phones are unchanged (no hover there).
- White days get no card.

Technical
- Wrap each day button in MonthCalendar with the existing shadcn HoverCard (Radix: opens on pointer enter, stays open while over trigger or content, closes after leaving both). Short open delay (~150 ms), close delay (~100 ms).
- New DayHoverSummary component renders info.reservations read-only (reuses guestLabel, nights, formatShort, sourceName, SourceMark).
- Only render HoverCard when info.kind is checkin, checkout, changeover, checkout-blocked or blocked.
