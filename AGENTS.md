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
