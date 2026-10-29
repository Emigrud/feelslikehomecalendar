ALTER TABLE public.apartments
  ADD COLUMN bed_options text[] NOT NULL DEFAULT '{}',
  ADD COLUMN std_checkin_time text CHECK (std_checkin_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD COLUMN std_checkout_time text CHECK (std_checkout_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD COLUMN timezone text NOT NULL DEFAULT 'Europe/Vilnius';

ALTER TABLE public.reservations
  ADD COLUMN prep_beds text[] NOT NULL DEFAULT '{}',
  ADD COLUMN prep_bed_note text,
  ADD COLUMN prep_cot text NOT NULL DEFAULT 'unknown' CHECK (prep_cot IN ('unknown','yes','no')),
  ADD COLUMN prep_towels integer CHECK (prep_towels BETWEEN 0 AND 30),
  ADD COLUMN prep_status text NOT NULL DEFAULT 'pending' CHECK (prep_status IN ('pending','confirmed')),
  ADD COLUMN checkin_time text CHECK (checkin_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD COLUMN checkout_time text CHECK (checkout_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD COLUMN arrival_time text CHECK (arrival_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

ALTER TABLE public.reservation_splits
  ADD COLUMN prep_beds text[] NOT NULL DEFAULT '{}',
  ADD COLUMN prep_bed_note text,
  ADD COLUMN prep_cot text NOT NULL DEFAULT 'unknown' CHECK (prep_cot IN ('unknown','yes','no')),
  ADD COLUMN prep_towels integer CHECK (prep_towels BETWEEN 0 AND 30),
  ADD COLUMN prep_status text NOT NULL DEFAULT 'pending' CHECK (prep_status IN ('pending','confirmed')),
  ADD COLUMN checkin_time text CHECK (checkin_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD COLUMN checkout_time text CHECK (checkout_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD COLUMN arrival_time text CHECK (arrival_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

-- A platform date or type change sends confirmed preparation back for review.
CREATE OR REPLACE FUNCTION public.reset_prep_on_source_change() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.check_in IS DISTINCT FROM OLD.check_in OR NEW.check_out IS DISTINCT FROM OLD.check_out
     OR NEW.is_blocked IS DISTINCT FROM OLD.is_blocked OR NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.prep_status := 'pending';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER reservations_reset_prep BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.reset_prep_on_source_change();

UPDATE public.apartments SET bed_options = '{"Sofa bed"}', std_checkin_time = '15:00', std_checkout_time = '12:00';