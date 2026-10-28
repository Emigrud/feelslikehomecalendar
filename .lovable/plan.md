# Share the calendar with your cleaner (private link, no login)

## What you will get
- **Settings → Cleaner link**: shows her private link with a **Copy** button. There is also a **Make a new link** button, which stops the old link from working, for example if it gets shared by mistake.
- **Her page**: she opens the link on her phone and sees your calendar right away, with no account and no password. She can bookmark it or add it to her home screen.
- **View-only**: she sees the same month calendar, colours, platform marks, guest numbers, names, check-in and check-out dates, the comment marks, the hover card and the day details. There are no Edit, pencil, Add, Delete, Block, Join back, Settings, Sync now or Sign out buttons. Her page can only read data, so nothing can be changed through it.
- **You stay the administrator** with everything you have now.

## Testing changes vs. what she sees
- **Your preview** (where you work with me) is private. App changes appear there first.
- **Published app**: she uses this one. It updates only when you press **Publish → Publish changes**. Her link keeps working after every publish.
- **Bookings and comments**: the preview and the published app use one shared database. New syncs and your edits show up for her without publishing. Her page refreshes when she opens it and every few minutes while it stays open.
- You need to **publish once** after this is built, so her link points to the published address.

## Note
- Anyone who has the link can see the calendar, including guest names. If it gets shared by mistake, tap **Make a new link**.

## Technical details
- No new tables: the link uses the existing `apartments.cleaner_token`.
- Public route `/c/$token` (SSR off, with a noindex meta tag). It calls a public `createServerFn`, `getCleanerCalendar(token)`, which:
  - validates the token format (hex);
  - loads the admin client inside the handler and finds the apartment by token;
  - returns only the name and the mapped reservations and splits. Feed URLs and the token are never returned.
- The shared loading and mapping logic is reused through `rowToReservation` and `expandSplits`.
- Rendering uses the existing MonthCalendar and DayDetails with `editable={false}`, and add forms are hidden. React Query refetches on window focus and every 5 minutes.
- Owner-only server function `regenerateCleanerToken`. Settings shows the link, built from the published URL when it exists, otherwise from the current origin.
- Tests: the token format check and the rule that the response never contains feed URLs or the token.
