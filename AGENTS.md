<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- The escaped `[index].tsx` route redirects the legacy `/index` preview address to `/`; why: mobile editor history must open the same protected calendar, not a missing page.
- Owner pages live under `src/routes/_authenticated/` (client-only gate, redirects to `/auth`); why: the login session lives in the browser.
- One apartment per owner (`apartments.owner_id` unique), created on first load; reservations are owner-only via row access rules; why: single-apartment product, cleaner gets data later only through a server function checking the link code.
- Database rows are mapped to the calendar `Reservation` type in `src/lib/reservation-row.ts`; why: calendar components stay storage-agnostic.
- Calendar feeds use ical.js, HTTPS platform-domain allowlists, bounded downloads and no redirects; why: private feed downloads must not reach arbitrary network destinations or accept incomplete files.
- Manual sync uses authenticated server functions; scheduled sync uses the generated managed cron authentication before admin access; why: owners remain RLS-scoped and unattended jobs need verified privileged access.
- Feed application is an atomic SECURITY INVOKER database function which updates only imported fields and cancels missing non-demo, non-manual UIDs per source only when check-in is after today (Europe/Warsaw) and preserve_on_feed_omission is not set; explicit feed cancellations still apply; why: platforms drop stays from feeds once they start, which is not a cancellation.
- Owner splits of merged stays live in their own table and expand into calendar parts at load time, each part separately blockable; a database trigger clears them when a stay's synced dates change; why: Booking.com merges back-to-back bookings and stale split dates must never show.
- Owner-edited stay dates live in owner_check_in/owner_check_out on reservations and override synced dates at load time (stayDates); why: syncs never undo the owner's length-of-stay changes.
- Owner-added entries use external_uid 'manual-<uuid>' and only Airbnb/Booking sources; apply_calendar_feed never updates or cancels them; why: hand-made bookings and blocks must survive every sync.
- The cleaner view is the public /c/$token route backed by a public server function that looks up apartments.cleaner_token with the admin client and returns only the name and reservations; why: no-login, read-only access without exposing feed links.
- Cleanings are derived at load time in src/lib/cleanings.ts (one per real departure, linked to the next real arrival, hand-added bookings win over synced stays they cover); the owner's planned cleaning date/time is stored on the departing reservation or split row and is never auto-moved; why: blocks must not create jobs and changed dates must show a warning instead of silently rescheduling.
