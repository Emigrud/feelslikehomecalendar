# Remove the "Split booking" button

## What changes
- The **Split booking** button disappears from the day popup for every booking.
- The date box and **Split here** / **Cancel** buttons that opened under it go away too.

## What stays the same
- Splits you already made stay as they are. For example, 24–25 / 25–26 October still shows the guest check-in on the 24th and your block on the 25th.
- **Join back with previous guest** stays on split parts, so you can still undo an old split.
- Everything else in the popup is unchanged: Edit details, the date pencil, Mark as blocked, Delete.

## Technical details
- In `DayDetails.tsx`, remove the Split booking button, the `splitting`/`splitDate` state, `openSplit`, `addSplit`, and the split date panel. Drop the `SplitDateField`, `shiftISO` and `isValidSplitDate` imports only if nothing else uses them. `SplitDateField` is still used by the date pencil and add-entry forms.
- No database changes. The splits table, its triggers and `expandSplits` stay, so existing splits keep showing correctly.
