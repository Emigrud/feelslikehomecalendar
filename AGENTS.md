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
- Owner pages live under `src/routes/_authenticated/` (client-only gate, redirects to `/auth`); why: the login session lives in the browser.
- One apartment per owner (`apartments.owner_id` unique), created on first load; reservations are owner-only via row access rules; why: single-apartment product, cleaner gets data later only through a server function checking the link code.
- Database rows are mapped to the calendar `Reservation` type in `src/lib/reservation-row.ts`; why: calendar components stay storage-agnostic.
- Calendar feeds use ical.js, HTTPS platform-domain allowlists, bounded downloads and no redirects; why: private feed downloads must not reach arbitrary network destinations or accept incomplete files.
- Manual sync uses authenticated server functions; scheduled sync uses the generated managed cron authentication before admin access; why: owners remain RLS-scoped and unattended jobs need verified privileged access.
- Feed application is an atomic SECURITY INVOKER database function which updates only imported fields and cancels missing non-demo UIDs per source; why: owner guest details survive sync and failed downloads cannot erase reservations.
- Owner splits of merged stays live in their own table and expand into calendar parts at load time, each part separately blockable; a database trigger clears them when a stay's synced dates change; why: Booking.com merges back-to-back bookings and stale split dates must never show.
