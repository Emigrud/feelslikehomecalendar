# Stage 2 — Owner login and saved data

## What you will get
- Lovable Cloud switched on (database, login, server logic — no extra accounts).
- A sign-in page: email + password for you (the owner). Sign up once, then sign in.
- The calendar page becomes owner-only: if not signed in, you are sent to the sign-in page. A "Sign out" button in the header.
- Your apartment and bookings are stored in the database instead of sample data. On your first sign-in, one apartment ("My Apartment") is created for you automatically, and it starts empty.
- A small "Add demo bookings" button while the calendar is empty, so you can still see how it looks before the calendar links are connected (Stage 4). It can be removed later.

## Not in this stage
- Editing guest numbers, names, comments (Stage 3).
- Calendar links, sync, settings, apartment name editing (Stage 4).
- Cleaner private link page (Stage 5).

## Technical details
- Enable Lovable Cloud; enable email/password auth.
- Tables:
  - `apartments`: id, owner_id (auth user), name, airbnb_ical_url, booking_ical_url, cleaner_token (random, unique), last_synced_at, last_sync_error, created_at.
  - `reservations`: id, apartment_id, source (airbnb|booking), external_uid, check_in, check_out, is_blocked, status (active|cancelled), guest_name, adults, kids_ages int[], comment, timestamps; unique (apartment_id, source, external_uid).
- GRANTs to authenticated + service_role; RLS so owners only see/change rows of their own apartment. No anon access (cleaner reads via a server function in Stage 5).
- No profiles/roles table needed — one owner per apartment via owner_id.
- Routes: `/auth` (public), calendar moved under `_authenticated/` gate; data loaded with route loader + React Query from the database, mapped to the existing `Reservation` type so the calendar components are unchanged.
- Existing calendar tests keep passing; add a test for the database-row → Reservation mapping.
