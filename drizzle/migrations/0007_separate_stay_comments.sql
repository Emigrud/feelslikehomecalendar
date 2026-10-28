ALTER TABLE public.reservations ADD COLUMN checkin_comment text, ADD COLUMN checkout_comment text;
ALTER TABLE public.reservation_splits ADD COLUMN checkin_comment text, ADD COLUMN checkout_comment text;
UPDATE public.reservations SET checkin_comment = comment WHERE comment IS NOT NULL AND NOT (is_blocked OR owner_kind = 'blocked');
UPDATE public.reservation_splits SET checkin_comment = comment WHERE comment IS NOT NULL AND NOT coalesce(is_blocked, false);
COMMENT ON COLUMN public.reservations.comment IS 'Used only for blocked entries; guest bookings use checkin_comment/checkout_comment';
COMMENT ON COLUMN public.reservation_splits.comment IS 'Used only for blocked parts; guest parts use checkin_comment/checkout_comment';