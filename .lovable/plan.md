# Improvement plan — read and understood (nothing built)

Order to follow: 5 → 6 → 1 → 2 → 3 → 4 → 7 → 8. I will wait for you to paste each stage before planning or building it.

## Summary of the stages
- **5. Preparation details and arrival times:** beds, cot (Unknown/Yes/No), towels, Pending/Confirmed status per booking and split part; standard times plus per-booking overrides.
- **6. Cleanings list:** Calendar / Cleanings switch; one cleaning per departure, linked to the next arrival; optional planned cleaning time; honest "not set / not booked" states.
- **1. Protect live data:** test data never reaches the live cleaner link; access checks; backup steps.
- **2. Safe sync:** per-platform status, failed or empty feeds never remove bookings, confirm missing events before cancelling.
- **3. Manual vs platform dates:** show both, "Use platform dates again", review when the platform changes underneath.
- **4. Needs attention list:** missing info, overlaps, removals, split conflicts, failed syncs.
- **7. Phone clarity:** 360 px width, tap instead of hover, labels not only colours, undo delete.
- **8. Final checks and notes** before publishing.

## Notes on what already exists
- Already in place: separate check-in and check-out comments, owner date overrides kept through syncs, manual entries kept through syncs, splits, a read-only cleaner link, 30-minute sync, and a rule that a failed download erases nothing.
- Preview and live share one database. So for testing I will use temporary test data that is never saved, unless you agree to a separate test setup.

Paste Stage 5 when you are ready.
