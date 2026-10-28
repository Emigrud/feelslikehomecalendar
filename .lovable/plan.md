# Share the calendar with your cleaner (view-only account)

## What you will get
- **Settings → Cleaner access**: a "Create invitation link" button, a Copy button, and "Make a new link" (the old link stops working). It also lists who has joined, with a **Remove access** button.
- **Invitation page**: she opens the link, enters her email and a password, and creates her account. If she already has an account, she signs in there instead. After that, she is connected to your calendar.
- **She stays signed in**: after she signs in once on her phone, the app keeps her signed in until she taps Sign out or clears the browser. Tip: she can add the page to her home screen.
- **View-only for her**: she sees the same month calendar, colours, platform marks, guest numbers, names, check-in and check-out dates, the comment marks, the hover card and the day details. She has no Edit, pencil, Add, Delete, Block, Join back, Settings or Sync now buttons. The database also refuses any change she tries to make, even outside the app.
- **You stay the administrator** with everything you have now.

## Testing changes vs. what she sees
- **Your preview** (where you work with me now) is private. App changes appear there first, and only you can see them.
- **Published app**: she uses this one. It updates only when you press **Publish → Publish changes**. Her link and account keep working after every publish.
- **Bookings and comments**: the preview and the published app use one shared database. New syncs from Airbnb and Booking.com, and your edits, show up for her right away, with no publishing. Her calendar also refreshes when she opens the app again.
- You need to **publish once** after this is built, so the published address exists. That address is where the invitation link points.

## Notes
- When she signs up, she gets one confirmation email and must tap the link in it. That is the normal safety step. Tell me if you would rather skip it.
- This replaces the old Stage 5 idea of a link with no login.

## Technical details
- Migration:
  - `apartment_members` (apartment_id, user_id, role 'viewer', created_at), with a unique pair.
  - `apartment_invites` (apartment_id, token random hex, created_at, revoked_at).
  - GRANTs, RLS on, and owner-only management.
  - SECURITY DEFINER `is_apartment_viewer(apartment_id)`.
  - New **SELECT-only** policies on reservations and reservation_splits for viewers. Write policies stay owner-only.
  - Viewers get no direct SELECT on `apartments`, which keeps the feed URLs and tokens private. A SECURITY DEFINER RPC `my_shared_apartment()` returns only id and name.
  - SECURITY DEFINER RPC `accept_invite(token)` checks that the invite is valid and not revoked, then inserts the member. The owner cannot join as a viewer.
- `loadApartment`:
  - Owners: if an owned apartment exists, it loads it as role "owner".
  - Viewers: if the user is a member, it loads the shared apartment as role "viewer" and never auto-creates one.
  - Otherwise it creates an apartment, as now.
- The calendar page passes `editable = role === "owner"`. It hides Settings, Sync and the add forms for viewers, and the settings route redirects viewers home.
- Public route `/invite/$token` for sign up or sign in, then `accept_invite`. If email confirmation is needed, the confirmation redirect returns to the invite URL, which finishes joining.
- Invite links are built from the published URL when it exists, otherwise from the current origin.
- Sessions use the default persisted login with auto-refresh, so no change is needed.
- Tests: role selection in loadApartment mapping; invite-link building.
